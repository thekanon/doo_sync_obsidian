import fs from 'fs/promises';
import path from 'path';
import { UserRole } from '@/app/types/user';
import { FileInfo, FilesQueryParams } from '@/app/api/v1/filesystem/files/route';
import { TreeNode, TreeQueryParams } from '@/app/api/v1/filesystem/tree/route';
import { PermissionService } from '@/services/permissions/PermissionService';
import { CacheService } from '@/services/cache/CacheService';
import { logger } from '@/app/lib/logger';

export interface DirectoryResult {
  files: FileInfo[];
  totalCount: number;
  parentPath: string | null;
  permissions: {
    canRead: boolean;
    canWrite: boolean;
    canCreate: boolean;
    isPublic: boolean;
  };
  statistics: {
    fileCount: number;
    directoryCount: number;
    totalSize: number;
  };
}

export interface TreeResult {
  tree: TreeNode;
  totalNodes: number;
  maxDepthReached: number;
}

export class DirectoryService {
  private readonly repoPath: string;
  private readonly rootDir: string;
  private readonly permissionService: PermissionService;
  private readonly cacheService: CacheService;

  constructor() {
    this.repoPath = process.env.REPO_PATH || '';
    this.rootDir = process.env.OBSIDIAN_ROOT_DIR || 'Root';
    this.permissionService = new PermissionService();
    this.cacheService = new CacheService();

    if (!this.repoPath) {
      throw new Error('REPO_PATH environment variable is required');
    }
  }

  /**
   * Get files and directories with filtering and pagination
   */
  async getFiles(params: FilesQueryParams, userRole: UserRole): Promise<DirectoryResult> {
    const startTime = Date.now();
    
    try {
      // Normalize and validate path
      const normalizedPath = this.normalizePath(params.path);
      const fullPath = path.join(this.repoPath, this.rootDir, normalizedPath);

      // Check if directory exists
      const exists = await this.pathExists(fullPath);
      if (!exists) {
        throw new Error(`Directory not found: ${normalizedPath}`);
      }

      // Get directory permissions
      const permissions = await this.getDirectoryPermissions(normalizedPath, userRole);

      // Load directory contents
      const allFiles = await this.loadDirectoryContents(
        fullPath,
        normalizedPath,
        params,
        userRole,
        0
      );

      // Apply sorting
      const sortedFiles = this.sortFiles(allFiles, params.sort_by, params.sort_order);

      // Apply pagination
      const startIndex = (params.page - 1) * params.per_page;
      const endIndex = startIndex + params.per_page;
      const paginatedFiles = sortedFiles.slice(startIndex, endIndex);

      // Calculate statistics
      const statistics = this.calculateStatistics(allFiles);

      // Get parent path
      const parentPath = this.getParentPath(normalizedPath);

      logger.debug('Directory service completed', {
        path: normalizedPath,
        totalFiles: allFiles.length,
        paginatedFiles: paginatedFiles.length,
        executionTime: Date.now() - startTime
      });

      return {
        files: paginatedFiles,
        totalCount: sortedFiles.length,
        parentPath,
        permissions,
        statistics
      };

    } catch (error) {
      logger.error('DirectoryService.getFiles error', {
        error: error instanceof Error ? error.message : String(error),
        params,
        executionTime: Date.now() - startTime
      });
      throw error;
    }
  }

  /**
   * Get directory tree structure with lazy loading
   */
  async getDirectoryTree(params: TreeQueryParams, userRole: UserRole): Promise<TreeResult> {
    const startTime = Date.now();
    
    try {
      // Normalize and validate path
      const normalizedPath = this.normalizePath(params.path);
      const fullPath = path.join(this.repoPath, this.rootDir, normalizedPath);

      // Check if directory exists
      const exists = await this.pathExists(fullPath);
      if (!exists) {
        throw new Error(`Directory not found: ${normalizedPath}`);
      }

      let totalNodes = 0;
      let maxDepthReached = 0;

      // Build tree recursively
      const tree = await this.buildTreeNode(
        fullPath,
        normalizedPath,
        params,
        userRole,
        0,
        { totalNodes: 0, maxDepthReached: 0 }
      );

      totalNodes = tree.metadata.totalNodes;
      maxDepthReached = tree.metadata.maxDepthReached;

      logger.debug('Directory tree service completed', {
        path: normalizedPath,
        totalNodes,
        maxDepthReached,
        executionTime: Date.now() - startTime
      });

      return {
        tree: tree.node,
        totalNodes,
        maxDepthReached
      };

    } catch (error) {
      logger.error('DirectoryService.getDirectoryTree error', {
        error: error instanceof Error ? error.message : String(error),
        params,
        executionTime: Date.now() - startTime
      });
      throw error;
    }
  }

  /**
   * Load directory contents recursively
   */
  private async loadDirectoryContents(
    fullPath: string,
    relativePath: string,
    params: FilesQueryParams,
    userRole: UserRole,
    currentDepth: number
  ): Promise<FileInfo[]> {
    const files: FileInfo[] = [];

    try {
      const entries = await fs.readdir(fullPath, { withFileTypes: true });

      for (const entry of entries) {
        // Skip hidden files and old index files
        if (entry.name.startsWith('.') || this.isLegacyIndexFile(entry.name)) {
          continue;
        }

        const itemPath = path.join(fullPath, entry.name);
        const itemRelativePath = path.join(relativePath, entry.name).replace(/\\/g, '/');

        // Check permissions for this item
        const hasAccess = await this.permissionService.checkFileAccess(userRole, itemRelativePath);
        if (!hasAccess) {
          continue;
        }

        // Get file stats
        const stats = await fs.stat(itemPath);

        if (entry.isDirectory()) {
          // Handle directory
          if (params.type === 'file') continue;

          const childCount = await this.getChildCount(itemPath);
          const hasIndexFile = await this.checkHasIndexFile(itemPath);

          const directoryInfo: FileInfo = {
            id: this.generateId('directory', itemRelativePath),
            name: entry.name,
            path: itemRelativePath,
            type: 'directory',
            created_at: stats.birthtime.toISOString(),
            modified_at: stats.mtime.toISOString(),
            accessed_at: stats.atime.toISOString(),
            child_count: childCount,
            has_index_file: hasIndexFile,
          };

          // Add permissions if requested
          if (params.include_permissions) {
            directoryInfo.permissions = await this.getFilePermissions(itemRelativePath, userRole);
          }

          files.push(directoryInfo);

          // Recurse into subdirectories if requested
          if (params.recursive && currentDepth < params.depth) {
            const subFiles = await this.loadDirectoryContents(
              itemPath,
              itemRelativePath,
              params,
              userRole,
              currentDepth + 1
            );
            files.push(...subFiles);
          }

        } else if (entry.isFile()) {
          // Handle file
          if (params.type === 'directory') continue;

          // Apply file extension filter
          if (params.extensions && params.extensions.length > 0) {
            const extension = path.extname(entry.name).slice(1).toLowerCase();
            if (!params.extensions.includes(extension)) continue;
          }

          // Apply exclude patterns
          if (params.exclude_patterns && params.exclude_patterns.length > 0) {
            const shouldExclude = params.exclude_patterns.some(pattern => {
              const regex = new RegExp(pattern.replace(/\*/g, '.*'));
              return regex.test(entry.name);
            });
            if (shouldExclude) continue;
          }

          const extension = path.extname(entry.name).slice(1);
          const mimeType = this.getMimeType(extension);

          const fileInfo: FileInfo = {
            id: this.generateId('file', itemRelativePath),
            name: entry.name,
            path: itemRelativePath,
            type: 'file',
            size: stats.size,
            extension: extension || undefined,
            mime_type: mimeType,
            created_at: stats.birthtime.toISOString(),
            modified_at: stats.mtime.toISOString(),
            accessed_at: stats.atime.toISOString(),
          };

          // Add permissions if requested
          if (params.include_permissions) {
            fileInfo.permissions = await this.getFilePermissions(itemRelativePath, userRole);
          }

          // Add metadata if requested
          if (params.include_metadata) {
            fileInfo.metadata = await this.getFileMetadata(itemPath, extension);
          }

          files.push(fileInfo);
        }
      }

    } catch (error) {
      logger.error('Error loading directory contents', {
        fullPath,
        relativePath,
        error: error instanceof Error ? error.message : String(error)
      });
      // Don't throw - return empty array for inaccessible directories
    }

    return files;
  }

  /**
   * Build tree node recursively
   */
  private async buildTreeNode(
    fullPath: string,
    relativePath: string,
    params: TreeQueryParams,
    userRole: UserRole,
    currentLevel: number,
    metadata: { totalNodes: number; maxDepthReached: number }
  ): Promise<{ node: TreeNode; metadata: typeof metadata }> {
    
    metadata.totalNodes++;
    metadata.maxDepthReached = Math.max(metadata.maxDepthReached, currentLevel);

    const stats = await fs.stat(fullPath);
    const pathSegments = relativePath.split('/').filter(Boolean);
    const name = pathSegments[pathSegments.length - 1] || this.rootDir;

    // Get child count
    const childCount = await this.getChildCount(fullPath);
    const hasChildren = childCount > 0;

    // Determine if node should be expanded
    const shouldExpand = !params.lazy_load || 
                        currentLevel === 0 || 
                        (params.expand_paths && params.expand_paths.includes(relativePath)) ||
                        currentLevel < Math.min(params.max_depth, 2);

    const node: TreeNode = {
      id: this.generateId('directory', relativePath),
      name,
      path: relativePath,
      type: 'directory',
      child_count: childCount,
      is_expanded: shouldExpand && hasChildren && currentLevel < params.max_depth,
      has_children: hasChildren,
      level: currentLevel,
      is_leaf: !hasChildren,
      created_at: stats.birthtime.toISOString(),
      modified_at: stats.mtime.toISOString(),
    };

    // Add permissions if requested
    if (params.include_permissions) {
      const permissions = await this.getFilePermissions(relativePath, userRole);
      node.permissions = {
        can_read: permissions.read,
        can_expand: permissions.read,
        is_public: permissions.is_public,
      };
    }

    // Load children if expanded and within depth limit
    if (node.is_expanded && currentLevel < params.max_depth) {
      node.children = [];

      try {
        const entries = await fs.readdir(fullPath, { withFileTypes: true });

        for (const entry of entries) {
          // Skip hidden files and old index files
          if (entry.name.startsWith('.') || this.isLegacyIndexFile(entry.name)) {
            continue;
          }

          const childPath = path.join(fullPath, entry.name);
          const childRelativePath = path.join(relativePath, entry.name).replace(/\\/g, '/');

          // Check permissions
          const hasAccess = await this.permissionService.checkFileAccess(userRole, childRelativePath);
          if (!hasAccess) {
            continue;
          }

          if (entry.isDirectory()) {
            // Recursively build child directory nodes
            const childResult = await this.buildTreeNode(
              childPath,
              childRelativePath,
              params,
              userRole,
              currentLevel + 1,
              metadata
            );
            node.children.push(childResult.node);

          } else if (entry.isFile() && params.include_files) {
            // Add file nodes if requested
            const fileStats = await fs.stat(childPath);
            const extension = path.extname(entry.name).slice(1);

            // Apply file extension filter
            if (params.file_extensions && params.file_extensions.length > 0) {
              if (!params.file_extensions.includes(extension.toLowerCase())) {
                continue;
              }
            }

            const fileNode: TreeNode = {
              id: this.generateId('file', childRelativePath),
              name: entry.name,
              path: childRelativePath,
              type: 'file',
              child_count: 0,
              is_expanded: false,
              has_children: false,
              level: currentLevel + 1,
              is_leaf: true,
              created_at: fileStats.birthtime.toISOString(),
              modified_at: fileStats.mtime.toISOString(),
            };

            node.children.push(fileNode);
            metadata.totalNodes++;
          }
        }

        // Sort children
        node.children.sort((a, b) => {
          // Directories first, then files
          if (a.type !== b.type) {
            return a.type === 'directory' ? -1 : 1;
          }
          // Then by name
          return a.name.localeCompare(b.name);
        });

      } catch (error) {
        logger.error('Error building tree node children', {
          fullPath,
          relativePath,
          error: error instanceof Error ? error.message : String(error)
        });
        // Continue without children
      }
    }

    return { node, metadata };
  }

  /**
   * Helper methods
   */
  private normalizePath(inputPath: string): string {
    // Remove leading/trailing slashes and normalize separators
    const normalized = inputPath.replace(/^\/+|\/+$/g, '').replace(/\\/g, '/');
    
    // Prevent path traversal
    const segments = normalized.split('/').filter(segment => 
      segment && segment !== '.' && segment !== '..'
    );
    
    return segments.join('/');
  }

  private async pathExists(fullPath: string): Promise<boolean> {
    try {
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  private isLegacyIndexFile(filename: string): boolean {
    return filename.includes('_Index_of_') || filename.startsWith('_Index_of_');
  }

  private generateId(type: 'file' | 'directory', path: string): string {
    const prefix = type === 'file' ? 'f_' : 'd_';
    const hash = Buffer.from(path).toString('base64url');
    return `${prefix}${hash}`;
  }

  private async getChildCount(dirPath: string): Promise<number> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      return entries.filter(entry => 
        !entry.name.startsWith('.') && 
        !this.isLegacyIndexFile(entry.name)
      ).length;
    } catch {
      return 0;
    }
  }

  private async checkHasIndexFile(dirPath: string): Promise<boolean> {
    try {
      const entries = await fs.readdir(dirPath);
      return entries.some(entry => 
        entry.toLowerCase() === 'readme.md' || 
        entry.toLowerCase() === 'index.md'
      );
    } catch {
      return false;
    }
  }

  private getMimeType(extension: string): string {
    const mimeTypes: { [key: string]: string } = {
      'md': 'text/markdown',
      'txt': 'text/plain',
      'json': 'application/json',
      'js': 'application/javascript',
      'ts': 'application/typescript',
      'html': 'text/html',
      'css': 'text/css',
      'pdf': 'application/pdf',
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'svg': 'image/svg+xml',
    };
    
    return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
  }

  private sortFiles(files: FileInfo[], sortBy: string, sortOrder: string): FileInfo[] {
    return [...files].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'modified':
          aValue = new Date(a.modified_at).getTime();
          bValue = new Date(b.modified_at).getTime();
          break;
        case 'created':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        case 'size':
          aValue = a.size || 0;
          bValue = b.size || 0;
          break;
        case 'type':
          aValue = a.type;
          bValue = b.type;
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      let comparison = 0;
      if (aValue < bValue) comparison = -1;
      if (aValue > bValue) comparison = 1;

      // Directories always come first regardless of other sorting
      if (a.type !== b.type) {
        return a.type === 'directory' ? -1 : 1;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });
  }

  private calculateStatistics(files: FileInfo[]): { fileCount: number; directoryCount: number; totalSize: number } {
    return files.reduce((stats, file) => {
      if (file.type === 'file') {
        stats.fileCount++;
        stats.totalSize += file.size || 0;
      } else {
        stats.directoryCount++;
      }
      return stats;
    }, { fileCount: 0, directoryCount: 0, totalSize: 0 });
  }

  private getParentPath(currentPath: string): string | null {
    if (!currentPath || currentPath === '/') return null;
    const segments = currentPath.split('/').filter(Boolean);
    if (segments.length <= 1) return '/';
    return '/' + segments.slice(0, -1).join('/');
  }

  private async getDirectoryPermissions(path: string, userRole: UserRole) {
    const permissions = await this.permissionService.getDirectoryPermissions(userRole, path);
    return {
      canRead: permissions.read,
      canWrite: permissions.write,
      canCreate: permissions.create,
      isPublic: permissions.isPublic,
    };
  }

  private async getFilePermissions(path: string, userRole: UserRole) {
    return await this.permissionService.getFilePermissions(userRole, path);
  }

  private async getFileMetadata(filePath: string, extension: string): Promise<FileInfo['metadata']> {
    // For now, return basic metadata based on file type
    // This can be extended to read actual file metadata
    const metadata: FileInfo['metadata'] = {};

    if (extension === 'md') {
      metadata.language = 'markdown';
    } else if (['js', 'ts'].includes(extension)) {
      metadata.language = 'javascript';
    }

    return metadata;
  }
}