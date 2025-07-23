import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { DirectoryService } from '@/services/filesystem/DirectoryService';
import { CacheService } from '@/services/cache/CacheService';
import { PermissionService } from '@/services/permissions/PermissionService';
import { getCurrentUser } from '@/app/lib/utils';
import { UserRole } from '@/app/types/user';
import { createErrorResponse, createSuccessResponse } from '@/app/lib/api-utils';
import { logger } from '@/app/lib/logger';

// Input validation schema
const FilesQuerySchema = z.object({
  path: z.string().max(1000).optional().default('/'),
  recursive: z.coerce.boolean().optional().default(false),
  depth: z.coerce.number().min(1).max(10).optional().default(3),
  type: z.enum(['file', 'directory', 'all']).optional().default('all'),
  extensions: z.string().transform(str => str.split(',')).optional(),
  exclude_patterns: z.string().transform(str => str.split(',')).optional(),
  sort_by: z.enum(['name', 'modified', 'created', 'size', 'type']).optional().default('name'),
  sort_order: z.enum(['asc', 'desc']).optional().default('asc'),
  page: z.coerce.number().min(1).optional().default(1),
  per_page: z.coerce.number().min(1).max(100).optional().default(50),
  include_metadata: z.coerce.boolean().optional().default(true),
  include_permissions: z.coerce.boolean().optional().default(false),
});

export type FilesQueryParams = z.infer<typeof FilesQuerySchema>;

export interface FileInfo {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  extension?: string;
  mime_type?: string;
  created_at: string;
  modified_at: string;
  accessed_at?: string;
  child_count?: number;
  has_index_file?: boolean;
  permissions?: {
    read: boolean;
    write: boolean;
    delete: boolean;
    is_public: boolean;
    required_roles: string[];
  };
  metadata?: {
    tags?: string[];
    description?: string;
    author?: string;
    language?: string;
  };
}

export interface FilesResponse {
  data: FileInfo[];
  pagination: {
    current_page: number;
    per_page: number;
    total_items: number;
    total_pages: number;
    has_next: boolean;
    has_previous: boolean;
  };
  metadata: {
    total_files: number;
    total_directories: number;
    current_path: string;
    parent_path: string | null;
    permissions: {
      can_read: boolean;
      can_write: boolean;
      can_create: boolean;
      is_public: boolean;
    };
  };
  cache_info: {
    cached: boolean;
    cache_key: string;
    expires_at: string;
  };
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();

  try {
    // Parse and validate query parameters
    const url = new URL(request.url);
    const rawParams = Object.fromEntries(url.searchParams.entries());
    
    const validationResult = FilesQuerySchema.safeParse(rawParams);
    if (!validationResult.success) {
      logger.warn('Invalid query parameters', { 
        errors: validationResult.error.errors,
        requestId 
      });
      
      return createErrorResponse({
        code: 'invalid_parameters',
        message: 'Invalid query parameters provided',
        detail: validationResult.error.errors[0]?.message,
        field: validationResult.error.errors[0]?.path.join('.'),
      }, 400, requestId);
    }

    const params = validationResult.data;

    // Get current user and check permissions
    const user = await getCurrentUser(request);
    const userRole = user?.role || UserRole.ANONYMOUS;

    // Validate path and check permissions
    const permissionService = new PermissionService();
    const hasAccess = await permissionService.checkDirectoryAccess(userRole, params.path);
    
    if (!hasAccess) {
      logger.warn('Directory access denied', { 
        userId: user?.uid,
        userRole,
        path: params.path,
        requestId 
      });
      
      return createErrorResponse({
        code: 'insufficient_permissions',
        message: 'You don\'t have permission to access this directory',
        detail: 'This directory requires higher privileges or explicit access permissions'
      }, 403, requestId);
    }

    // Check cache first
    const cacheService = new CacheService();
    const cacheKey = cacheService.generateFilesListKey(params, userRole);
    const cachedResponse = await cacheService.get<FilesResponse>(cacheKey);

    if (cachedResponse) {
      logger.debug('Serving from cache', { cacheKey, requestId });
      
      return createSuccessResponse(cachedResponse, {
        'X-Cache': 'HIT',
        'X-Request-ID': requestId,
        'X-Response-Time': `${Date.now() - startTime}ms`
      });
    }

    // Initialize directory service
    const directoryService = new DirectoryService();

    // Get files with the specified parameters
    const result = await directoryService.getFiles(params, userRole);

    // Build response
    const response: FilesResponse = {
      data: result.files,
      pagination: {
        current_page: params.page,
        per_page: params.per_page,
        total_items: result.totalCount,
        total_pages: Math.ceil(result.totalCount / params.per_page),
        has_next: params.page < Math.ceil(result.totalCount / params.per_page),
        has_previous: params.page > 1,
      },
      metadata: {
        total_files: result.statistics.fileCount,
        total_directories: result.statistics.directoryCount,
        current_path: params.path,
        parent_path: result.parentPath,
        permissions: {
          can_read: result.permissions.canRead,
          can_write: result.permissions.canWrite,
          can_create: result.permissions.canCreate,
          is_public: result.permissions.isPublic,
        }
      },
      cache_info: {
        cached: false,
        cache_key: cacheKey,
        expires_at: new Date(Date.now() + cacheService.getTTL('FILES_LIST') * 1000).toISOString(),
      }
    };

    // Cache the response
    await cacheService.set(cacheKey, response, 'FILES_LIST');

    logger.info('Files API request completed', {
      requestId,
      path: params.path,
      userRole,
      filesCount: result.files.length,
      responseTime: Date.now() - startTime
    });

    return createSuccessResponse(response, {
      'X-Cache': 'MISS',
      'X-Request-ID': requestId,
      'X-Response-Time': `${Date.now() - startTime}ms`,
      'Cache-Control': 'private, max-age=300' // 5 minutes client cache
    });

  } catch (error) {
    logger.error('Files API error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      requestId,
      responseTime: Date.now() - startTime
    });

    if (error instanceof Error && error.message.includes('ENOENT')) {
      return createErrorResponse({
        code: 'directory_not_found',
        message: 'The specified directory was not found',
        detail: 'Please check the path and try again'
      }, 404, requestId);
    }

    return createErrorResponse({
      code: 'internal_error',
      message: 'An unexpected error occurred while processing your request',
      detail: 'Please try again later or contact support if the problem persists'
    }, 500, requestId);
  }
}