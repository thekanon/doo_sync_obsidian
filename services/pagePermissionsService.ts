import fs from 'fs';
import path from 'path';
import { logger } from '@/app/lib/logger';
import { UserRole } from '@/app/types/user';

interface PagePermission {
  path: string;
  allowedRoles: UserRole[];
  isPublic: boolean;
}

let cachedPagePermissions: PagePermission[] | null = null;
let lastModified: number = 0;

/**
 * Read page permissions from a JSON configuration file
 * @param filePath Path to the JSON file containing page permissions
 * @returns Array of page permissions
 */
export function readPagePermissions(filePath?: string): PagePermission[] {
  const permissionsFile = filePath || process.env.PAGE_PERMISSIONS_FILE || 'config/page-permissions.json';
  const fullPath = path.resolve(permissionsFile);

  try {
    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      logger.warn(`Page permissions file not found: ${fullPath}, using default permissions`);
      return getDefaultPagePermissions();
    }

    // Check file modification time for caching
    const stats = fs.statSync(fullPath);
    const currentModified = stats.mtime.getTime();

    if (cachedPagePermissions && currentModified === lastModified) {
      return cachedPagePermissions;
    }

    // Read and parse the JSON file
    const content = fs.readFileSync(fullPath, 'utf-8');
    const permissions = JSON.parse(content) as PagePermission[];

    // Validate the permissions structure
    if (!Array.isArray(permissions)) {
      throw new Error('Page permissions must be an array');
    }

    for (const permission of permissions) {
      if (!permission.path || typeof permission.path !== 'string') {
        throw new Error('Each permission must have a valid path string');
      }
      if (!Array.isArray(permission.allowedRoles)) {
        throw new Error('Each permission must have allowedRoles as an array');
      }
      if (typeof permission.isPublic !== 'boolean') {
        throw new Error('Each permission must have isPublic as a boolean');
      }
    }

    // Update cache
    cachedPagePermissions = permissions;
    lastModified = currentModified;

    logger.debug(`Loaded ${permissions.length} page permissions from ${fullPath}`);
    return permissions;

  } catch (error) {
    logger.error(`Error reading page permissions file: ${error}`);
    return getDefaultPagePermissions();
  }
}

/**
 * Get default page permissions if config file is not available
 */
function getDefaultPagePermissions(): PagePermission[] {
  const rootDir = process.env.OBSIDIAN_ROOT_DIR || 'Root';
  
  return [
    // 모든 사용자 접근 가능
    {
      path: '/',
      allowedRoles: [],
      isPublic: true,
    },
    {
      path: '/login*',
      allowedRoles: [],
      isPublic: true,
    },
    {
      path: `/_Index_of_${rootDir}*`,
      allowedRoles: [],
      isPublic: true,
    },
    {
      path: '/unauthorized',
      allowedRoles: [],
      isPublic: true,
    },
    // 어드민 권한만 접근 가능
    {
      path: '/1. 일지*',
      allowedRoles: [UserRole.ADMIN],
      isPublic: false,
    },
    {
      path: '/3. 회사*',
      allowedRoles: [UserRole.ADMIN],
      isPublic: false,
    },
    {
      path: '/*/_Index_of_커리어*',
      allowedRoles: [UserRole.ADMIN],
      isPublic: false,
    },
    {
      path: '/7. 생각정리/커리어*',
      allowedRoles: [UserRole.ADMIN],
      isPublic: false,
    },
    {
      path: '/*/_Index_of_99.일기*',
      allowedRoles: [UserRole.ADMIN],
      isPublic: false,
    },
    {
      path: '/97. 보안 폴더*',
      allowedRoles: [UserRole.ADMIN],
      isPublic: false,
    },
    {
      path: '/99. 일기*',
      allowedRoles: [UserRole.ADMIN],
      isPublic: false,
    },
    // 어드민, 인증된 사용자만 접근 가능
    {
      path: '/8. 루틴*',
      allowedRoles: [UserRole.ADMIN, UserRole.VERIFIED],
      isPublic: false,
    },
    {
      path: '/98. 미분류*',
      allowedRoles: [UserRole.ADMIN],
      isPublic: false,
    },
  ];
}

/**
 * Get public page list from permissions
 */
export function getPublicPageList(): string[] {
  const permissions = readPagePermissions();
  return permissions
    .filter(permission => permission.isPublic)
    .map(permission => permission.path);
}

/**
 * Clear the cache (useful for testing)
 */
export function clearPagePermissionsCache(): void {
  cachedPagePermissions = null;
  lastModified = 0;
}

// Re-export the PagePermission interface for compatibility
export type { PagePermission };