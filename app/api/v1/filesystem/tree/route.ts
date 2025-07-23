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
const TreeQuerySchema = z.object({
  path: z.string().max(1000).optional().default('/'),
  max_depth: z.coerce.number().min(1).max(5).optional().default(3),
  lazy_load: z.coerce.boolean().optional().default(true),
  expand_paths: z.string().transform(str => str ? str.split(',') : []).optional(),
  include_files: z.coerce.boolean().optional().default(false),
  file_extensions: z.string().transform(str => str ? str.split(',') : []).optional(),
  exclude_hidden: z.coerce.boolean().optional().default(true),
  include_counts: z.coerce.boolean().optional().default(true),
  include_permissions: z.coerce.boolean().optional().default(false),
});

export type TreeQueryParams = z.infer<typeof TreeQuerySchema>;

export interface TreeNode {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: TreeNode[];
  child_count: number;
  is_expanded: boolean;
  has_children: boolean;
  level: number;
  is_leaf: boolean;
  created_at: string;
  modified_at: string;
  permissions?: {
    can_read: boolean;
    can_expand: boolean;
    is_public: boolean;
  };
  lazy_load_url?: string;
}

export interface TreeResponse {
  tree: TreeNode;
  metadata: {
    total_nodes: number;
    max_depth_reached: number;
    lazy_load_enabled: boolean;
    generated_at: string;
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
    
    const validationResult = TreeQuerySchema.safeParse(rawParams);
    if (!validationResult.success) {
      logger.warn('Invalid tree query parameters', { 
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
      logger.warn('Tree access denied', { 
        userId: user?.uid,
        userRole,
        path: params.path,
        requestId 
      });
      
      return createErrorResponse({
        code: 'insufficient_permissions',
        message: 'You don\'t have permission to access this directory tree',
        detail: 'This directory requires higher privileges or explicit access permissions'
      }, 403, requestId);
    }

    // Check cache first
    const cacheService = new CacheService();
    const cacheKey = cacheService.generateTreeKey(params, userRole);
    const cachedResponse = await cacheService.get<TreeResponse>(cacheKey);

    if (cachedResponse) {
      logger.debug('Serving tree from cache', { cacheKey, requestId });
      
      return createSuccessResponse(cachedResponse, {
        'X-Cache': 'HIT',
        'X-Request-ID': requestId,
        'X-Response-Time': `${Date.now() - startTime}ms`
      });
    }

    // Initialize directory service
    const directoryService = new DirectoryService();

    // Get directory tree
    const result = await directoryService.getDirectoryTree(params, userRole);

    // Build lazy load URLs for unexpanded nodes
    const addLazyLoadUrls = (node: TreeNode, baseUrl: string): TreeNode => {
      if (node.type === 'directory' && !node.is_expanded && node.has_children) {
        node.lazy_load_url = `${baseUrl}/api/v1/filesystem/tree?path=${encodeURIComponent(node.path)}&max_depth=1&lazy_load=true`;
      }
      
      if (node.children) {
        node.children = node.children.map(child => addLazyLoadUrls(child, baseUrl));
      }
      
      return node;
    };

    const baseUrl = request.nextUrl.origin;
    const treeWithUrls = addLazyLoadUrls(result.tree, baseUrl);

    // Build response
    const response: TreeResponse = {
      tree: treeWithUrls,
      metadata: {
        total_nodes: result.totalNodes,
        max_depth_reached: result.maxDepthReached,
        lazy_load_enabled: params.lazy_load,
        generated_at: new Date().toISOString(),
      },
      cache_info: {
        cached: false,
        cache_key: cacheKey,
        expires_at: new Date(Date.now() + cacheService.getTTL('TREE_STRUCTURE') * 1000).toISOString(),
      }
    };

    // Cache the response
    await cacheService.set(cacheKey, response, 'TREE_STRUCTURE');

    logger.info('Tree API request completed', {
      requestId,
      path: params.path,
      userRole,
      totalNodes: result.totalNodes,
      maxDepth: result.maxDepthReached,
      responseTime: Date.now() - startTime
    });

    return createSuccessResponse(response, {
      'X-Cache': 'MISS',
      'X-Request-ID': requestId,
      'X-Response-Time': `${Date.now() - startTime}ms`,
      'Cache-Control': 'private, max-age=600' // 10 minutes client cache
    });

  } catch (error) {
    logger.error('Tree API error', {
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