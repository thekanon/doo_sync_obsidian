import { NextRequest } from 'next/server';
import { GET } from '@/app/api/v1/filesystem/files/route';
import { DirectoryService } from '@/services/filesystem/DirectoryService';
import { PermissionService } from '@/services/permissions/PermissionService';
import { CacheService } from '@/services/cache/CacheService';
import { getCurrentUser } from '@/app/lib/utils';
import { UserRole } from '@/app/types/user';

// Mock dependencies
jest.mock('@/services/filesystem/DirectoryService');
jest.mock('@/services/permissions/PermissionService');
jest.mock('@/services/cache/CacheService');
jest.mock('@/app/lib/utils');
jest.mock('@/app/lib/logger');

const mockDirectoryService = DirectoryService as jest.MockedClass<typeof DirectoryService>;
const mockPermissionService = PermissionService as jest.MockedClass<typeof PermissionService>;
const mockCacheService = CacheService as jest.MockedClass<typeof CacheService>;
const mockGetCurrentUser = getCurrentUser as jest.MockedFunction<typeof getCurrentUser>;

describe('/api/v1/filesystem/files', () => {
  let mockRequest: NextRequest;
  let mockDirectoryServiceInstance: jest.Mocked<DirectoryService>;
  let mockPermissionServiceInstance: jest.Mocked<PermissionService>;
  let mockCacheServiceInstance: jest.Mocked<CacheService>;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup mock instances
    mockDirectoryServiceInstance = {
      getFiles: jest.fn(),
    } as any;

    mockPermissionServiceInstance = {
      checkDirectoryAccess: jest.fn(),
    } as any;

    mockCacheServiceInstance = {
      generateFilesListKey: jest.fn(),
      get: jest.fn(),
      set: jest.fn(),
      getTTL: jest.fn(),
    } as any;

    // Setup mock constructors
    mockDirectoryService.mockImplementation(() => mockDirectoryServiceInstance);
    mockPermissionService.mockImplementation(() => mockPermissionServiceInstance);
    mockCacheService.mockImplementation(() => mockCacheServiceInstance);

    // Setup default mock return values
    mockGetCurrentUser.mockResolvedValue({
      uid: 'test-user',
      email: 'test@example.com',
      role: UserRole.VERIFIED,
    } as any);

    mockPermissionServiceInstance.checkDirectoryAccess.mockResolvedValue(true);
    mockCacheServiceInstance.generateFilesListKey.mockReturnValue('test-cache-key');
    mockCacheServiceInstance.get.mockResolvedValue(null);
    mockCacheServiceInstance.getTTL.mockReturnValue(300);
  });

  describe('GET /api/v1/filesystem/files', () => {
    it('should return files list successfully', async () => {
      // Setup test data
      const mockFiles = [
        {
          id: 'f_test_file_1',
          name: 'test.md',
          path: '/test.md',
          type: 'file' as const,
          size: 1024,
          extension: 'md',
          mime_type: 'text/markdown',
          created_at: '2024-01-01T00:00:00Z',
          modified_at: '2024-01-02T00:00:00Z',
        },
        {
          id: 'd_test_dir_1',
          name: 'folder',
          path: '/folder',
          type: 'directory' as const,
          created_at: '2024-01-01T00:00:00Z',
          modified_at: '2024-01-02T00:00:00Z',
          child_count: 5,
          has_index_file: false,
        }
      ];

      const mockResult = {
        files: mockFiles,
        totalCount: 2,
        parentPath: null,
        permissions: {
          canRead: true,
          canWrite: false,
          canCreate: false,
          isPublic: true,
        },
        statistics: {
          fileCount: 1,
          directoryCount: 1,
          totalSize: 1024,
        }
      };

      mockDirectoryServiceInstance.getFiles.mockResolvedValue(mockResult);

      // Create mock request
      mockRequest = new NextRequest('http://localhost:3000/api/v1/filesystem/files?path=/&page=1&per_page=50');

      // Execute
      const response = await GET(mockRequest);
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.data).toHaveLength(2);
      expect(data.data.data[0]).toMatchObject({
        id: 'f_test_file_1',
        name: 'test.md',
        type: 'file',
      });
      expect(data.data.pagination).toMatchObject({
        current_page: 1,
        per_page: 50,
        total_items: 2,
        total_pages: 1,
        has_next: false,
        has_previous: false,
      });

      // Verify service calls
      expect(mockPermissionServiceInstance.checkDirectoryAccess).toHaveBeenCalledWith(UserRole.VERIFIED, '/');
      expect(mockDirectoryServiceInstance.getFiles).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/',
          page: 1,
          per_page: 50,
        }),
        UserRole.VERIFIED
      );
    });

    it('should return 400 for invalid parameters', async () => {
      // Create request with invalid depth parameter
      mockRequest = new NextRequest('http://localhost:3000/api/v1/filesystem/files?depth=15');

      // Execute
      const response = await GET(mockRequest);
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('invalid_parameters');
      expect(data.error.field).toContain('depth');
    });

    it('should return 403 for insufficient permissions', async () => {
      // Setup permission denial
      mockPermissionServiceInstance.checkDirectoryAccess.mockResolvedValue(false);

      // Create mock request
      mockRequest = new NextRequest('http://localhost:3000/api/v1/filesystem/files?path=/private');

      // Execute
      const response = await GET(mockRequest);
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('insufficient_permissions');
      expect(mockDirectoryServiceInstance.getFiles).not.toHaveBeenCalled();
    });

    it('should serve from cache when available', async () => {
      // Setup cached response
      const cachedResponse = {
        data: [],
        pagination: {
          current_page: 1,
          per_page: 50,
          total_items: 0,
          total_pages: 0,
          has_next: false,
          has_previous: false,
        },
        metadata: {
          total_files: 0,
          total_directories: 0,
          current_path: '/',
          parent_path: null,
          permissions: {
            can_read: true,
            can_write: false,
            can_create: false,
            is_public: true,
          }
        },
        cache_info: {
          cached: true,
          cache_key: 'test-cache-key',
          expires_at: '2024-01-01T01:00:00Z',
        }
      };

      mockCacheServiceInstance.get.mockResolvedValue(cachedResponse);

      // Create mock request
      mockRequest = new NextRequest('http://localhost:3000/api/v1/filesystem/files');

      // Execute
      const response = await GET(mockRequest);
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(response.headers.get('X-Cache')).toBe('HIT');
      expect(data.data).toEqual(cachedResponse);
      expect(mockDirectoryServiceInstance.getFiles).not.toHaveBeenCalled();
    });

    it('should handle directory not found error', async () => {
      // Setup directory service to throw ENOENT error
      const error = new Error('Directory not found');
      error.message = 'ENOENT: no such file or directory';
      mockDirectoryServiceInstance.getFiles.mockRejectedValue(error);

      // Create mock request
      mockRequest = new NextRequest('http://localhost:3000/api/v1/filesystem/files?path=/nonexistent');

      // Execute
      const response = await GET(mockRequest);
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('directory_not_found');
    });

    it('should handle internal server errors', async () => {
      // Setup directory service to throw unexpected error
      mockDirectoryServiceInstance.getFiles.mockRejectedValue(new Error('Unexpected error'));

      // Create mock request
      mockRequest = new NextRequest('http://localhost:3000/api/v1/filesystem/files');

      // Execute
      const response = await GET(mockRequest);
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('internal_error');
    });

    it('should handle anonymous users', async () => {
      // Setup anonymous user
      mockGetCurrentUser.mockResolvedValue(null);

      const mockResult = {
        files: [],
        totalCount: 0,
        parentPath: null,
        permissions: {
          canRead: true,
          canWrite: false,
          canCreate: false,
          isPublic: true,
        },
        statistics: {
          fileCount: 0,
          directoryCount: 0,
          totalSize: 0,
        }
      };

      mockDirectoryServiceInstance.getFiles.mockResolvedValue(mockResult);

      // Create mock request
      mockRequest = new NextRequest('http://localhost:3000/api/v1/filesystem/files');

      // Execute
      const response = await GET(mockRequest);

      // Assertions
      expect(response.status).toBe(200);
      expect(mockPermissionServiceInstance.checkDirectoryAccess).toHaveBeenCalledWith(UserRole.ANONYMOUS, '/');
      expect(mockDirectoryServiceInstance.getFiles).toHaveBeenCalledWith(
        expect.any(Object),
        UserRole.ANONYMOUS
      );
    });

    it('should validate and transform query parameters correctly', async () => {
      const mockResult = {
        files: [],
        totalCount: 0,
        parentPath: null,
        permissions: {
          canRead: true,
          canWrite: false,
          canCreate: false,
          isPublic: true,
        },
        statistics: {
          fileCount: 0,
          directoryCount: 0,
          totalSize: 0,
        }
      };

      mockDirectoryServiceInstance.getFiles.mockResolvedValue(mockResult);

      // Create request with various parameters
      mockRequest = new NextRequest(
        'http://localhost:3000/api/v1/filesystem/files' +
        '?path=/test' +
        '&recursive=true' +
        '&depth=2' +
        '&type=file' +
        '&extensions=md,txt' +
        '&sort_by=modified' +
        '&sort_order=desc' +
        '&page=2' +
        '&per_page=25' +
        '&include_metadata=false' +
        '&include_permissions=true'
      );

      // Execute
      await GET(mockRequest);

      // Verify correct parameter transformation
      expect(mockDirectoryServiceInstance.getFiles).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/test',
          recursive: true,
          depth: 2,
          type: 'file',
          extensions: ['md', 'txt'],
          sort_by: 'modified',
          sort_order: 'desc',
          page: 2,
          per_page: 25,
          include_metadata: false,
          include_permissions: true,
        }),
        UserRole.VERIFIED
      );
    });
  });
});