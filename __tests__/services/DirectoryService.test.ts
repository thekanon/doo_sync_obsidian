import fs from 'fs/promises';
import path from 'path';
import { DirectoryService } from '@/services/filesystem/DirectoryService';
import { PermissionService } from '@/services/permissions/PermissionService';
import { CacheService } from '@/services/cache/CacheService';
import { UserRole } from '@/app/types/user';

// Mock dependencies
jest.mock('fs/promises');
jest.mock('@/services/permissions/PermissionService');
jest.mock('@/services/cache/CacheService');
jest.mock('@/app/lib/logger');

const mockFs = fs as jest.Mocked<typeof fs>;
const mockPermissionService = PermissionService as jest.MockedClass<typeof PermissionService>;
const mockCacheService = CacheService as jest.MockedClass<typeof CacheService>;

describe('DirectoryService', () => {
  let directoryService: DirectoryService;
  let mockPermissionServiceInstance: jest.Mocked<PermissionService>;
  let mockCacheServiceInstance: jest.Mocked<CacheService>;

  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment
    process.env = {
      ...originalEnv,
      REPO_PATH: '/test/repo',
      OBSIDIAN_ROOT_DIR: 'Root',
    };

    jest.clearAllMocks();

    // Setup mock instances
    mockPermissionServiceInstance = {
      checkFileAccess: jest.fn(),
      getDirectoryPermissions: jest.fn(),
      getFilePermissions: jest.fn(),
    } as any;

    mockCacheServiceInstance = {
      generateFilesListKey: jest.fn(),
      get: jest.fn(),
      set: jest.fn(),
      getTTL: jest.fn(),
    } as any;

    mockPermissionService.mockImplementation(() => mockPermissionServiceInstance);
    mockCacheService.mockImplementation(() => mockCacheServiceInstance);

    // Default permission setup
    mockPermissionServiceInstance.checkFileAccess.mockResolvedValue(true);
    mockPermissionServiceInstance.getDirectoryPermissions.mockResolvedValue({
      read: true,
      write: false,
      delete: false,
      create: false,
      is_public: true,
      required_roles: [],
    });
    mockPermissionServiceInstance.getFilePermissions.mockResolvedValue({
      read: true,
      write: false,
      delete: false,
      is_public: true,
      required_roles: [],
    });

    directoryService = new DirectoryService();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('constructor', () => {
    it('should throw error if REPO_PATH is not set', () => {
      delete process.env.REPO_PATH;
      expect(() => new DirectoryService()).toThrow('REPO_PATH environment variable is required');
    });

    it('should use default OBSIDIAN_ROOT_DIR if not set', () => {
      delete process.env.OBSIDIAN_ROOT_DIR;
      expect(() => new DirectoryService()).not.toThrow();
    });
  });

  describe('getFiles', () => {
    const mockParams = {
      path: '/test',
      recursive: false,
      depth: 3,
      type: 'all' as const,
      sort_by: 'name' as const,
      sort_order: 'asc' as const,
      page: 1,
      per_page: 50,
      include_metadata: true,
      include_permissions: false,
    };

    beforeEach(() => {
      // Mock fs.access to simulate directory exists
      mockFs.access = jest.fn().mockResolvedValue(undefined);
    });

    it('should return files and directories successfully', async () => {
      // Setup mock file system
      const mockStats = {
        isDirectory: () => false,
        isFile: () => true,
        size: 1024,
        birthtime: new Date('2024-01-01'),
        mtime: new Date('2024-01-02'),
        atime: new Date('2024-01-03'),
      };

      const mockDirStats = {
        isDirectory: () => true,
        isFile: () => false,
        birthtime: new Date('2024-01-01'),
        mtime: new Date('2024-01-02'),
        atime: new Date('2024-01-03'),
      };

      mockFs.readdir = jest.fn().mockResolvedValue([
        { name: 'test.md', isDirectory: () => false, isFile: () => true },
        { name: 'folder', isDirectory: () => true, isFile: () => false },
        { name: '.hidden', isDirectory: () => false, isFile: () => true },
        { name: '_Index_of_old.md', isDirectory: () => false, isFile: () => true },
      ] as any);

      mockFs.stat = jest.fn()
        .mockResolvedValueOnce(mockStats) // test.md
        .mockResolvedValueOnce(mockDirStats) // folder
        .mockResolvedValueOnce({ size: 0 }); // child count check

      // Mock child count for directory
      mockFs.readdir = jest.fn()
        .mockResolvedValueOnce([
          { name: 'test.md', isDirectory: () => false, isFile: () => true },
          { name: 'folder', isDirectory: () => true, isFile: () => false },
          { name: '.hidden', isDirectory: () => false, isFile: () => true },
          { name: '_Index_of_old.md', isDirectory: () => false, isFile: () => true },
        ] as any)
        .mockResolvedValue([]); // child count for folder

      const result = await directoryService.getFiles(mockParams, UserRole.VERIFIED);

      expect(result.files).toHaveLength(2); // Should exclude hidden and index files
      expect(result.files[0]).toMatchObject({
        name: 'folder',
        type: 'directory',
        child_count: 0,
      });
      expect(result.files[1]).toMatchObject({
        name: 'test.md',
        type: 'file',
        size: 1024,
        extension: 'md',
        mime_type: 'text/markdown',
      });
      expect(result.totalCount).toBe(2);
      expect(result.statistics).toEqual({
        fileCount: 1,
        directoryCount: 1,
        totalSize: 1024,
      });
    });

    it('should handle recursive directory traversal', async () => {
      const recursiveParams = { ...mockParams, recursive: true, depth: 2 };

      mockFs.readdir = jest.fn()
        .mockResolvedValueOnce([
          { name: 'folder', isDirectory: () => true, isFile: () => false },
        ] as any)
        .mockResolvedValueOnce([
          { name: 'subfolder', isDirectory: () => true, isFile: () => false },
          { name: 'subfile.txt', isDirectory: () => false, isFile: () => true },
        ] as any)
        .mockResolvedValue([]); // Empty for child counts and deeper levels

      const mockDirStats = {
        isDirectory: () => true,
        isFile: () => false,
        birthtime: new Date('2024-01-01'),
        mtime: new Date('2024-01-02'),
        atime: new Date('2024-01-03'),
      };

      const mockFileStats = {
        isDirectory: () => false,
        isFile: () => true,
        size: 512,
        birthtime: new Date('2024-01-01'),
        mtime: new Date('2024-01-02'),
        atime: new Date('2024-01-03'),
      };

      mockFs.stat = jest.fn()
        .mockResolvedValue(mockDirStats)
        .mockResolvedValueOnce(mockDirStats) // folder
        .mockResolvedValueOnce(mockDirStats) // subfolder
        .mockResolvedValueOnce(mockFileStats); // subfile.txt

      const result = await directoryService.getFiles(recursiveParams, UserRole.VERIFIED);

      expect(result.files.length).toBeGreaterThan(1);
      expect(result.files.some(f => f.path.includes('subfolder'))).toBe(true);
      expect(result.files.some(f => f.name === 'subfile.txt')).toBe(true);
    });

    it('should apply file type filtering', async () => {
      const fileOnlyParams = { ...mockParams, type: 'file' as const };

      mockFs.readdir = jest.fn().mockResolvedValue([
        { name: 'test.md', isDirectory: () => false, isFile: () => true },
        { name: 'folder', isDirectory: () => true, isFile: () => false },
      ] as any);

      const mockFileStats = {
        isDirectory: () => false,
        isFile: () => true,
        size: 1024,
        birthtime: new Date('2024-01-01'),
        mtime: new Date('2024-01-02'),
        atime: new Date('2024-01-03'),
      };

      mockFs.stat = jest.fn().mockResolvedValue(mockFileStats);

      const result = await directoryService.getFiles(fileOnlyParams, UserRole.VERIFIED);

      expect(result.files).toHaveLength(1);
      expect(result.files[0].type).toBe('file');
      expect(result.files[0].name).toBe('test.md');
    });

    it('should apply extension filtering', async () => {
      const extensionParams = { ...mockParams, extensions: ['md'] };

      mockFs.readdir = jest.fn().mockResolvedValue([
        { name: 'test.md', isDirectory: () => false, isFile: () => true },
        { name: 'test.txt', isDirectory: () => false, isFile: () => true },
      ] as any);

      const mockFileStats = {
        isDirectory: () => false,
        isFile: () => true,
        size: 1024,
        birthtime: new Date('2024-01-01'),
        mtime: new Date('2024-01-02'),
        atime: new Date('2024-01-03'),
      };

      mockFs.stat = jest.fn().mockResolvedValue(mockFileStats);

      const result = await directoryService.getFiles(extensionParams, UserRole.VERIFIED);

      expect(result.files).toHaveLength(1);
      expect(result.files[0].name).toBe('test.md');
    });

    it('should handle permission filtering', async () => {
      // Setup permission service to deny access to specific files
      mockPermissionServiceInstance.checkFileAccess
        .mockResolvedValueOnce(true) // test.md allowed
        .mockResolvedValueOnce(false); // secret.md denied

      mockFs.readdir = jest.fn().mockResolvedValue([
        { name: 'test.md', isDirectory: () => false, isFile: () => true },
        { name: 'secret.md', isDirectory: () => false, isFile: () => true },
      ] as any);

      const mockFileStats = {
        isDirectory: () => false,
        isFile: () => true,
        size: 1024,
        birthtime: new Date('2024-01-01'),
        mtime: new Date('2024-01-02'),
        atime: new Date('2024-01-03'),
      };

      mockFs.stat = jest.fn().mockResolvedValue(mockFileStats);

      const result = await directoryService.getFiles(mockParams, UserRole.GUEST);

      expect(result.files).toHaveLength(1);
      expect(result.files[0].name).toBe('test.md');
      expect(mockPermissionServiceInstance.checkFileAccess).toHaveBeenCalledTimes(2);
    });

    it('should handle sorting correctly', async () => {
      const sortParams = { ...mockParams, sort_by: 'modified' as const, sort_order: 'desc' as const };

      mockFs.readdir = jest.fn().mockResolvedValue([
        { name: 'old.md', isDirectory: () => false, isFile: () => true },
        { name: 'new.md', isDirectory: () => false, isFile: () => true },
        { name: 'folder', isDirectory: () => true, isFile: () => false },
      ] as any);

      const oldFileStats = {
        isDirectory: () => false,
        isFile: () => true,
        size: 1024,
        birthtime: new Date('2024-01-01'),
        mtime: new Date('2024-01-01'), // older
        atime: new Date('2024-01-01'),
      };

      const newFileStats = {
        isDirectory: () => false,
        isFile: () => true,
        size: 1024,
        birthtime: new Date('2024-01-01'),
        mtime: new Date('2024-01-02'), // newer
        atime: new Date('2024-01-01'),
      };

      const dirStats = {
        isDirectory: () => true,
        isFile: () => false,
        birthtime: new Date('2024-01-01'),
        mtime: new Date('2024-01-01'),
        atime: new Date('2024-01-01'),
      };

      mockFs.stat = jest.fn()
        .mockResolvedValueOnce(oldFileStats)
        .mockResolvedValueOnce(newFileStats)
        .mockResolvedValueOnce(dirStats)
        .mockResolvedValue({ size: 0 }); // child counts

      const result = await directoryService.getFiles(sortParams, UserRole.VERIFIED);

      // Directory should come first, then files sorted by modified date desc
      expect(result.files[0].type).toBe('directory');
      expect(result.files[1].name).toBe('new.md'); // newer file first
      expect(result.files[2].name).toBe('old.md'); // older file second
    });

    it('should handle pagination correctly', async () => {
      const paginationParams = { ...mockParams, page: 2, per_page: 1 };

      // Create mock files
      const mockFiles = Array.from({ length: 3 }, (_, i) => ({
        name: `file${i}.md`,
        isDirectory: () => false,
        isFile: () => true,
      }));

      mockFs.readdir = jest.fn().mockResolvedValue(mockFiles as any);

      const mockFileStats = {
        isDirectory: () => false,
        isFile: () => true,
        size: 1024,
        birthtime: new Date('2024-01-01'),
        mtime: new Date('2024-01-02'),
        atime: new Date('2024-01-03'),
      };

      mockFs.stat = jest.fn().mockResolvedValue(mockFileStats);

      const result = await directoryService.getFiles(paginationParams, UserRole.VERIFIED);

      expect(result.files).toHaveLength(1); // Only one file per page
      expect(result.totalCount).toBe(3); // Total count should be 3
    });

    it('should throw error for non-existent directory', async () => {
      mockFs.access = jest.fn().mockRejectedValue(new Error('ENOENT'));

      await expect(
        directoryService.getFiles(mockParams, UserRole.VERIFIED)
      ).rejects.toThrow('Directory not found');
    });
  });

  describe('getDirectoryTree', () => {
    const mockTreeParams = {
      path: '/',
      max_depth: 3,
      lazy_load: true,
      include_files: false,
      exclude_hidden: true,
      include_counts: true,
      include_permissions: false,
    };

    it('should build directory tree successfully', async () => {
      mockFs.access = jest.fn().mockResolvedValue(undefined);
      
      // Mock root directory
      mockFs.stat = jest.fn().mockResolvedValue({
        birthtime: new Date('2024-01-01'),
        mtime: new Date('2024-01-02'),
      });

      // Mock directory contents
      mockFs.readdir = jest.fn()
        .mockResolvedValueOnce([
          { name: 'folder1', isDirectory: () => true, isFile: () => false },
          { name: 'folder2', isDirectory: () => true, isFile: () => false },
          { name: '.hidden', isDirectory: () => true, isFile: () => false },
          { name: '_Index_of_old', isDirectory: () => false, isFile: () => true },
        ] as any)
        .mockResolvedValue([]); // Empty child directories

      const result = await directoryService.getDirectoryTree(mockTreeParams, UserRole.VERIFIED);

      expect(result.tree.name).toBe('Root');
      expect(result.tree.type).toBe('directory');
      expect(result.tree.level).toBe(0);
      expect(result.tree.children).toHaveLength(2); // Should exclude hidden and index files
      expect(result.totalNodes).toBeGreaterThan(0);
    });

    it('should handle lazy loading correctly', async () => {
      const lazyParams = { ...mockTreeParams, lazy_load: true, max_depth: 1 };

      mockFs.access = jest.fn().mockResolvedValue(undefined);
      mockFs.stat = jest.fn().mockResolvedValue({
        birthtime: new Date('2024-01-01'),
        mtime: new Date('2024-01-02'),
      });

      mockFs.readdir = jest.fn()
        .mockResolvedValueOnce([
          { name: 'folder1', isDirectory: () => true, isFile: () => false },
        ] as any)
        .mockResolvedValue([
          { name: 'nested', isDirectory: () => true, isFile: () => false },
        ] as any);

      const result = await directoryService.getDirectoryTree(lazyParams, UserRole.VERIFIED);

      // With lazy loading and max_depth=1, should not expand deeply
      expect(result.tree.children?.[0]?.is_expanded).toBe(false);
      expect(result.tree.children?.[0]?.has_children).toBe(true);
    });

    it('should include files when requested', async () => {
      const fileParams = { ...mockTreeParams, include_files: true };

      mockFs.access = jest.fn().mockResolvedValue(undefined);
      mockFs.stat = jest.fn().mockResolvedValue({
        birthtime: new Date('2024-01-01'),
        mtime: new Date('2024-01-02'),
      });

      mockFs.readdir = jest.fn().mockResolvedValue([
        { name: 'folder', isDirectory: () => true, isFile: () => false },
        { name: 'file.md', isDirectory: () => false, isFile: () => true },
      ] as any);

      const result = await directoryService.getDirectoryTree(fileParams, UserRole.VERIFIED);

      expect(result.tree.children?.some(child => child.type === 'file')).toBe(true);
      expect(result.tree.children?.some(child => child.name === 'file.md')).toBe(true);
    });
  });
});