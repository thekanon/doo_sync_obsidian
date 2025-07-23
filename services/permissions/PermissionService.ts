import { UserRole } from '@/app/types/user';
import { logger } from '@/app/lib/logger';
import { CacheService } from '@/services/cache/CacheService';

export interface FilePermissions {
  read: boolean;
  write: boolean;
  delete: boolean;
  is_public: boolean;
  required_roles: string[];
}

export interface DirectoryPermissions extends FilePermissions {
  create: boolean;
}

export interface PermissionRule {
  path: string;
  allowedRoles: UserRole[];
  isPublic: boolean;
  permissions?: {
    read?: boolean;
    write?: boolean;
    delete?: boolean;
    create?: boolean;
  };
}

export class PermissionService {
  private readonly cacheService: CacheService;
  private permissionRules: PermissionRule[] = [];
  private readonly rootDir: string;

  constructor() {
    this.cacheService = new CacheService();
    this.rootDir = process.env.OBSIDIAN_ROOT_DIR || 'Root';
    this.loadPermissionRules();
  }

  /**
   * Load permission rules from configuration
   */
  private loadPermissionRules(): void {
    // Load from environment or configuration file
    // For now, using the migrated rules from the old system
    this.permissionRules = [
      // Root access - public
      {
        path: '/',
        allowedRoles: [],
        isPublic: true,
        permissions: { read: true, write: false, delete: false, create: false }
      },
      {
        path: `/Root`,
        allowedRoles: [],
        isPublic: true,
        permissions: { read: true, write: false, delete: false, create: false }
      },
      // Login page - public
      {
        path: '/login*',
        allowedRoles: [],
        isPublic: true,
        permissions: { read: true, write: false, delete: false, create: false }
      },
      // Unauthorized page - public
      {
        path: '/unauthorized',
        allowedRoles: [],
        isPublic: true,
        permissions: { read: true, write: false, delete: false, create: false }
      },
      // Private directories - admin only
      {
        path: '/1. 일지*',
        allowedRoles: [UserRole.ADMIN],
        isPublic: false,
        permissions: { read: true, write: true, delete: true, create: true }
      },
      {
        path: '/7. 생각정리*',
        allowedRoles: [UserRole.ADMIN],
        isPublic: false,
        permissions: { read: true, write: true, delete: true, create: true }
      },
      {
        path: '/8. 루틴*',
        allowedRoles: [UserRole.VERIFIED, UserRole.ADMIN],
        isPublic: false,
        permissions: { read: true, write: false, delete: false, create: false }
      },
      {
        path: '/3. 회사*',
        allowedRoles: [UserRole.ADMIN],
        isPublic: false,
        permissions: { read: true, write: true, delete: true, create: true }
      },
      {
        path: '/97. 보안 폴더*',
        allowedRoles: [UserRole.ADMIN],
        isPublic: false,
        permissions: { read: true, write: true, delete: true, create: true }
      },
      {
        path: '/98. 미분류*',
        allowedRoles: [UserRole.ADMIN],
        isPublic: false,
        permissions: { read: true, write: true, delete: true, create: true }
      },
      {
        path: '/99. 일기*',
        allowedRoles: [UserRole.ADMIN],
        isPublic: false,
        permissions: { read: true, write: true, delete: true, create: true }
      },
      // Career-related paths - admin only
      {
        path: '/*/커리어*',
        allowedRoles: [UserRole.ADMIN],
        isPublic: false,
        permissions: { read: true, write: true, delete: true, create: true }
      },
      {
        path: '/7. 생각정리/커리어*',
        allowedRoles: [UserRole.ADMIN],
        isPublic: false,
        permissions: { read: true, write: true, delete: true, create: true }
      },
    ];

    logger.debug('Permission rules loaded', { 
      ruleCount: this.permissionRules.length 
    });
  }

  /**
   * Check if a user has access to a specific directory
   */
  async checkDirectoryAccess(userRole: UserRole, directoryPath: string): Promise<boolean> {
    const cacheKey = this.cacheService.generatePermissionKey(userRole, directoryPath, 'directory');
    
    // Check cache first
    const cachedResult = await this.cacheService.get<boolean>(cacheKey);
    if (cachedResult !== null) {
      return cachedResult;
    }

    const hasAccess = this.evaluatePermissions(userRole, directoryPath, 'read');
    
    // Cache the result
    await this.cacheService.set(cacheKey, hasAccess, 'USER_PERMISSIONS');

    logger.debug('Directory access check', {
      userRole,
      directoryPath,
      hasAccess
    });

    return hasAccess;
  }

  /**
   * Check if a user has access to a specific file
   */
  async checkFileAccess(userRole: UserRole, filePath: string): Promise<boolean> {
    const cacheKey = this.cacheService.generatePermissionKey(userRole, filePath, 'file');
    
    // Check cache first
    const cachedResult = await this.cacheService.get<boolean>(cacheKey);
    if (cachedResult !== null) {
      return cachedResult;
    }

    const hasAccess = this.evaluatePermissions(userRole, filePath, 'read');
    
    // Cache the result
    await this.cacheService.set(cacheKey, hasAccess, 'USER_PERMISSIONS');

    return hasAccess;
  }

  /**
   * Get detailed permissions for a directory
   */
  async getDirectoryPermissions(userRole: UserRole, directoryPath: string): Promise<DirectoryPermissions> {
    const cacheKey = this.cacheService.generatePermissionKey(userRole, directoryPath, 'directory_detailed');
    
    // Check cache first
    const cachedResult = await this.cacheService.get<DirectoryPermissions>(cacheKey);
    if (cachedResult !== null) {
      return cachedResult;
    }

    const permissions: DirectoryPermissions = {
      read: this.evaluatePermissions(userRole, directoryPath, 'read'),
      write: this.evaluatePermissions(userRole, directoryPath, 'write'),
      delete: this.evaluatePermissions(userRole, directoryPath, 'delete'),
      create: this.evaluatePermissions(userRole, directoryPath, 'create'),
      is_public: this.isPathPublic(directoryPath),
      required_roles: this.getRequiredRoles(directoryPath),
    };

    // Cache the result
    await this.cacheService.set(cacheKey, permissions, 'USER_PERMISSIONS');

    return permissions;
  }

  /**
   * Get detailed permissions for a file
   */
  async getFilePermissions(userRole: UserRole, filePath: string): Promise<FilePermissions> {
    const cacheKey = this.cacheService.generatePermissionKey(userRole, filePath, 'file_detailed');
    
    // Check cache first
    const cachedResult = await this.cacheService.get<FilePermissions>(cacheKey);
    if (cachedResult !== null) {
      return cachedResult;
    }

    const permissions: FilePermissions = {
      read: this.evaluatePermissions(userRole, filePath, 'read'),
      write: this.evaluatePermissions(userRole, filePath, 'write'),
      delete: this.evaluatePermissions(userRole, filePath, 'delete'),
      is_public: this.isPathPublic(filePath),
      required_roles: this.getRequiredRoles(filePath),
    };

    // Cache the result
    await this.cacheService.set(cacheKey, permissions, 'USER_PERMISSIONS');

    return permissions;
  }

  /**
   * Get all accessible directories for a user
   */
  async getUserAccessibleDirectories(userRole: UserRole): Promise<string[]> {
    const cacheKey = this.cacheService.generateUserDirectoriesKey(userRole);
    
    // Check cache first
    const cachedResult = await this.cacheService.get<string[]>(cacheKey);
    if (cachedResult !== null) {
      return cachedResult;
    }

    const accessiblePaths: string[] = [];
    
    // Check each permission rule
    for (const rule of this.permissionRules) {
      if (this.evaluateRuleForUser(rule, userRole, 'read')) {
        // Add the base path (remove wildcards)
        const basePath = rule.path.replace(/\*/g, '');
        if (!accessiblePaths.includes(basePath)) {
          accessiblePaths.push(basePath);
        }
      }
    }

    // Always include root if user has any access
    if (accessiblePaths.length > 0 && !accessiblePaths.includes('/')) {
      accessiblePaths.unshift('/');
    }

    // Cache the result
    await this.cacheService.set(cacheKey, accessiblePaths, 'USER_PERMISSIONS');

    return accessiblePaths;
  }

  /**
   * Invalidate permission cache for a user
   */
  async invalidateUserPermissions(userId: string): Promise<void> {
    // This would typically involve invalidating all cache keys for the user
    // For now, we'll just log the action
    logger.info('Permission cache invalidated', { userId });
  }

  /**
   * Core permission evaluation logic
   */
  private evaluatePermissions(userRole: UserRole, targetPath: string, action: 'read' | 'write' | 'delete' | 'create'): boolean {
    // Normalize path
    const normalizedPath = this.normalizePath(targetPath);

    // Find matching permission rule
    const matchingRule = this.findMatchingRule(normalizedPath);
    
    if (!matchingRule) {
      // Default: allow read access to public paths, deny everything else
      return action === 'read';
    }

    // Check if user role matches
    if (!this.evaluateRuleForUser(matchingRule, userRole, action)) {
      return false;
    }

    return true;
  }

  /**
   * Find the most specific matching permission rule
   */
  private findMatchingRule(targetPath: string): PermissionRule | null {
    const matchingRules = this.permissionRules.filter(rule => {
      const pattern = this.createPathPattern(rule.path);
      return pattern.test(targetPath);
    });

    if (matchingRules.length === 0) {
      return null;
    }

    // Return the most specific rule (longest path without wildcards)
    return matchingRules.reduce((mostSpecific, current) => {
      const currentSpecificity = this.calculateRuleSpecificity(current.path);
      const mostSpecificSpecificity = this.calculateRuleSpecificity(mostSpecific.path);
      
      return currentSpecificity > mostSpecificSpecificity ? current : mostSpecific;
    });
  }

  /**
   * Evaluate if a rule applies to a user for a specific action
   */
  private evaluateRuleForUser(rule: PermissionRule, userRole: UserRole, action: 'read' | 'write' | 'delete' | 'create'): boolean {
    // Check if it's a public rule
    if (rule.isPublic && action === 'read') {
      return true;
    }

    // Check if user role is allowed
    if (rule.allowedRoles.length === 0 && rule.isPublic) {
      return action === 'read'; // Public paths only allow read by default
    }

    if (!rule.allowedRoles.includes(userRole)) {
      return false;
    }

    // Check specific permission if defined
    if (rule.permissions) {
      switch (action) {
        case 'read':
          return rule.permissions.read !== false;
        case 'write':
          return rule.permissions.write === true;
        case 'delete':
          return rule.permissions.delete === true;
        case 'create':
          return rule.permissions.create === true;
        default:
          return false;
      }
    }

    // Default: allow read for matching roles, deny write/delete/create unless explicitly granted
    return action === 'read';
  }

  /**
   * Create regex pattern from path rule
   */
  private createPathPattern(rulePath: string): RegExp {
    // Escape special regex characters except *
    let pattern = rulePath.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
    
    // Replace * with regex pattern
    pattern = pattern.replace(/\*/g, '.*');
    
    // Ensure it matches from the beginning
    pattern = '^' + pattern + '$';
    
    return new RegExp(pattern, 'i'); // Case insensitive
  }

  /**
   * Calculate rule specificity for conflict resolution
   */
  private calculateRuleSpecificity(rulePath: string): number {
    // More specific rules have higher scores
    let specificity = rulePath.length;
    
    // Reduce score for wildcards
    const wildcardCount = (rulePath.match(/\*/g) || []).length;
    specificity -= wildcardCount * 10;
    
    return specificity;
  }

  /**
   * Check if a path is public
   */
  private isPathPublic(targetPath: string): boolean {
    const normalizedPath = this.normalizePath(targetPath);
    const matchingRule = this.findMatchingRule(normalizedPath);
    
    return matchingRule?.isPublic || false;
  }

  /**
   * Get required roles for a path
   */
  private getRequiredRoles(targetPath: string): string[] {
    const normalizedPath = this.normalizePath(targetPath);
    const matchingRule = this.findMatchingRule(normalizedPath);
    
    return matchingRule?.allowedRoles || [];
  }

  /**
   * Normalize path for consistent matching
   */
  private normalizePath(inputPath: string): string {
    // Remove leading/trailing slashes and normalize separators
    let normalized = inputPath.replace(/^\/+|\/+$/g, '').replace(/\\/g, '/');
    
    // Handle root path
    if (!normalized) {
      return '/';
    }
    
    // Add leading slash for consistency
    return '/' + normalized;
  }
}