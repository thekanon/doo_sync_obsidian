/**
 * Page permissions configuration for DooSyncObsidian
 * Static configuration to avoid Edge Runtime compatibility issues
 */
import { UserRole } from './user';

export interface PagePermission {
  path: string;
  allowedRoles: UserRole[];
  isPublic: boolean;
}

// Static page permissions configuration
export const pagePermissions: PagePermission[] = [
  // Public pages
  {
    path: '/',
    allowedRoles: [],
    isPublic: true
  },
  {
    path: '/login*',
    allowedRoles: [],
    isPublic: true
  },
  {
    path: '/_Index_of_Root*',
    allowedRoles: [],
    isPublic: true
  },
  {
    path: '/unauthorized',
    allowedRoles: [],
    isPublic: true
  },
  // Admin only pages
  {
    path: '/1. 일지*',
    allowedRoles: [UserRole.ADMIN],
    isPublic: false
  },
  {
    path: '/3. 회사*',
    allowedRoles: [UserRole.ADMIN],
    isPublic: false
  },
  {
    path: '/*/_Index_of_커리어*',
    allowedRoles: [UserRole.ADMIN],
    isPublic: false
  },
  {
    path: '/7. 생각정리/커리어*',
    allowedRoles: [UserRole.ADMIN],
    isPublic: false
  },
  {
    path: '/*/_Index_of_99.일기*',
    allowedRoles: [UserRole.ADMIN],
    isPublic: false
  },
  {
    path: '/97. 보안 폴더*',
    allowedRoles: [UserRole.ADMIN],
    isPublic: false
  },
  {
    path: '/99. 일기*',
    allowedRoles: [UserRole.ADMIN],
    isPublic: false
  },
  {
    path: '/98. 미분류*',
    allowedRoles: [UserRole.ADMIN],
    isPublic: false
  },
  // Admin and verified users
  {
    path: '/8. 루틴*',
    allowedRoles: [UserRole.ADMIN, UserRole.VERIFIED],
    isPublic: false
  },
  // Legacy paths
  {
    path: '/admin/*',
    allowedRoles: [UserRole.ADMIN],
    isPublic: false
  },
  {
    path: '/verified-only/*',
    allowedRoles: [UserRole.ADMIN, UserRole.VERIFIED],
    isPublic: false
  },
  {
    path: '/public/*',
    allowedRoles: [UserRole.ADMIN, UserRole.VERIFIED, UserRole.GUEST, UserRole.ANONYMOUS],
    isPublic: true
  },
  {
    path: '/Root/*',
    allowedRoles: [UserRole.ADMIN, UserRole.VERIFIED, UserRole.GUEST],
    isPublic: false
  }
];

// Public page list for quick access
export const isPublicPageList = pagePermissions
  .filter(permission => permission.isPublic)
  .map(permission => permission.path);
