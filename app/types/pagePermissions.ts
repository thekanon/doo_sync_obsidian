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
