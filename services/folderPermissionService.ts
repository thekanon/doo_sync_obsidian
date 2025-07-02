import { readFileSync } from 'fs';
import { join } from 'path';
import { UserRole } from '../app/types/user';

interface FolderPermission {
  path: string;
  allowedRoles: string[];
  isPublic: boolean;
  description?: string;
}

interface FolderPermissionConfig {
  folderPermissions: FolderPermission[];
  defaultPermissions: {
    publicFolders: string[];
    guestAccessible: string[];
  };
  settings: {
    inheritPermissions: boolean;
    wildcardEnabled: boolean;
    caseSensitive: boolean;
  };
}

class FolderPermissionService {
  private static instance: FolderPermissionService;
  private config: FolderPermissionConfig | null = null;
  private configPath: string;

  private constructor() {
    this.configPath = process.env.FOLDER_PERMISSIONS_FILE || 'config/folder-permissions.json';
  }

  public static getInstance(): FolderPermissionService {
    if (!FolderPermissionService.instance) {
      FolderPermissionService.instance = new FolderPermissionService();
    }
    return FolderPermissionService.instance;
  }

  private loadConfig(): FolderPermissionConfig {
    if (this.config) {
      return this.config;
    }

    try {
      const configFilePath = join(process.cwd(), this.configPath);
      const configData = readFileSync(configFilePath, 'utf-8');
      this.config = JSON.parse(configData);
      return this.config!;
    } catch (error) {
      console.error('Failed to load folder permissions config:', error);
      return this.getFallbackConfig();
    }
  }

  private getFallbackConfig(): FolderPermissionConfig {
    return {
      folderPermissions: [
        {
          path: "/1. 일지*",
          allowedRoles: ["ADMIN"],
          isPublic: false,
          description: "개인 일지 폴더 - 관리자만 접근 가능"
        },
        {
          path: "/3. 회사*",
          allowedRoles: ["ADMIN"],
          isPublic: false,
          description: "회사 관련 폴더 - 관리자만 접근 가능"
        }
      ],
      defaultPermissions: {
        publicFolders: [],
        guestAccessible: []
      },
      settings: {
        inheritPermissions: true,
        wildcardEnabled: true,
        caseSensitive: false
      }
    };
  }

  public refreshConfig(): void {
    this.config = null;
    this.loadConfig();
  }

  private normalizePathForMatching(path: string): string {
    // Remove /Root prefix if present
    let normalizedPath = path.replace(/^\/Root/, '');
    
    // Remove file extensions
    normalizedPath = normalizedPath.replace(/\.[^.]*$/, '');
    
    // Ensure path starts with /
    if (!normalizedPath.startsWith('/')) {
      normalizedPath = '/' + normalizedPath;
    }

    return normalizedPath;
  }

  private pathMatches(requestPath: string, rulePath: string, caseSensitive: boolean = false): boolean {
    const normalizedRequestPath = this.normalizePathForMatching(requestPath);
    
    if (!caseSensitive) {
      requestPath = normalizedRequestPath.toLowerCase();
      rulePath = rulePath.toLowerCase();
    } else {
      requestPath = normalizedRequestPath;
    }

    // Handle wildcard patterns
    if (rulePath.includes('*')) {
      const regexPattern = rulePath
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // Escape special regex characters
        .replace(/\\\*/g, '.*'); // Convert * to .*
      
      const regex = new RegExp(`^${regexPattern}$`);
      return regex.test(requestPath);
    }

    // Exact match
    return requestPath === rulePath;
  }

  public hasAccess(path: string, userRole: UserRole): boolean {
    const config = this.loadConfig();
    
    // Check if path is in public folders
    if (config.defaultPermissions.publicFolders.some(publicPath => 
      this.pathMatches(path, publicPath, config.settings.caseSensitive))) {
      return true;
    }

    // Check if path is guest accessible
    if (config.defaultPermissions.guestAccessible.some(guestPath => 
      this.pathMatches(path, guestPath, config.settings.caseSensitive))) {
      return userRole !== UserRole.ANONYMOUS;
    }

    // Check specific folder permissions
    for (const permission of config.folderPermissions) {
      if (this.pathMatches(path, permission.path, config.settings.caseSensitive)) {
        if (permission.isPublic) {
          return true;
        }
        
        return permission.allowedRoles.includes(userRole);
      }
    }

    // Default behavior: allow access for non-anonymous users to unspecified paths
    return userRole !== UserRole.ANONYMOUS;
  }

  public isPublicPath(path: string): boolean {
    const config = this.loadConfig();
    
    // Check public folders
    if (config.defaultPermissions.publicFolders.some(publicPath => 
      this.pathMatches(path, publicPath, config.settings.caseSensitive))) {
      return true;
    }

    // Check specific permissions
    for (const permission of config.folderPermissions) {
      if (this.pathMatches(path, permission.path, config.settings.caseSensitive)) {
        return permission.isPublic;
      }
    }

    return false;
  }

  public getRequiredRoles(path: string): string[] {
    const config = this.loadConfig();
    
    // Check if path is public
    if (this.isPublicPath(path)) {
      return [];
    }

    // Check if path is guest accessible
    if (config.defaultPermissions.guestAccessible.some(guestPath => 
      this.pathMatches(path, guestPath, config.settings.caseSensitive))) {
      return [UserRole.GUEST, UserRole.VERIFIED, UserRole.ADMIN];
    }

    // Check specific folder permissions
    for (const permission of config.folderPermissions) {
      if (this.pathMatches(path, permission.path, config.settings.caseSensitive)) {
        return permission.allowedRoles;
      }
    }

    // Default: require at least GUEST role
    return [UserRole.GUEST, UserRole.VERIFIED, UserRole.ADMIN];
  }

  public getFolderPermissions(): FolderPermission[] {
    const config = this.loadConfig();
    return [...config.folderPermissions];
  }

  public addFolderPermission(permission: FolderPermission): void {
    const config = this.loadConfig();
    
    // Remove existing permission for the same path
    config.folderPermissions = config.folderPermissions.filter(
      p => !this.pathMatches(permission.path, p.path, config.settings.caseSensitive)
    );
    
    // Add new permission
    config.folderPermissions.push(permission);
  }

  public removeFolderPermission(path: string): void {
    const config = this.loadConfig();
    config.folderPermissions = config.folderPermissions.filter(
      p => !this.pathMatches(path, p.path, config.settings.caseSensitive)
    );
  }

  public updateFolderPermission(path: string, updates: Partial<FolderPermission>): void {
    const config = this.loadConfig();
    const permissionIndex = config.folderPermissions.findIndex(
      p => this.pathMatches(path, p.path, config.settings.caseSensitive)
    );
    
    if (permissionIndex !== -1) {
      config.folderPermissions[permissionIndex] = {
        ...config.folderPermissions[permissionIndex],
        ...updates
      };
    }
  }
}

export default FolderPermissionService;