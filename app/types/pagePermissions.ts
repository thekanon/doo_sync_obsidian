/**
 * @deprecated This file is deprecated. Use pagePermissionsService instead.
 * Page permissions are now loaded from external configuration files.
 */
import { readPagePermissions, getPublicPageList } from '../../services/pagePermissionsService';

// Re-export for backward compatibility
export const pagePermissions = readPagePermissions();
export const isPublicPageList = getPublicPageList();
