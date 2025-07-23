import { logger } from '@/app/lib/logger';
import { UserRole } from '@/app/types/user';
import { FilesQueryParams } from '@/app/api/v1/filesystem/files/route';
import { TreeQueryParams } from '@/app/api/v1/filesystem/tree/route';

// Cache key patterns
const CACHE_KEYS = {
  FILES_LIST: 'fs:files:{path}:{params_hash}:{user_role}',
  TREE_STRUCTURE: 'fs:tree:{path}:{depth}:{user_role}',
  DIRECTORY_INFO: 'fs:dir:{path}:{user_role}',
  SEARCH_RESULTS: 'fs:search:{query_hash}:{user_role}',
  USER_PERMISSIONS: 'fs:perms:{user_role}:{path}:{type}',
  USER_DIRECTORIES: 'fs:user_dirs:{user_role}',
  DIRECTORY_STATS: 'fs:stats:{path}',
};

// Cache TTL in seconds
const CACHE_TTL = {
  FILES_LIST: 300,        // 5 minutes
  TREE_STRUCTURE: 600,    // 10 minutes
  DIRECTORY_INFO: 180,    // 3 minutes
  SEARCH_RESULTS: 3600,   // 1 hour
  USER_PERMISSIONS: 1800, // 30 minutes
  USER_DIRECTORIES: 1800, // 30 minutes
  DIRECTORY_STATS: 900,   // 15 minutes
};

export type CacheKeyType = keyof typeof CACHE_TTL;

interface CacheConfig {
  enabled: boolean;
  redis?: {
    host: string;
    port: number;
    db: number;
    password?: string;
    maxRetries: number;
    retryDelayOnFailover: number;
  };
  memory?: {
    maxSize: number; // Maximum number of entries
    ttlCheckInterval: number; // Interval in ms to check for expired entries
  };
}

export class CacheService {
  private config: CacheConfig;
  private memoryCache: Map<string, { value: any; expiry: number }> = new Map();
  private redis: any = null; // Redis client would be initialized here

  constructor() {
    this.config = this.loadConfig();
    
    if (this.config.enabled) {
      this.initializeCache();
    }

    // Start TTL cleanup for memory cache
    if (this.config.memory) {
      setInterval(() => {
        this.cleanupExpiredEntries();
      }, this.config.memory.ttlCheckInterval);
    }
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.config.enabled) {
      return null;
    }

    try {
      // Try Redis first if available
      if (this.redis) {
        const result = await this.redis.get(key);
        if (result) {
          const parsed = JSON.parse(result);
          logger.debug('Cache hit (Redis)', { key });
          return parsed as T;
        }
      }

      // Fall back to memory cache
      const memoryEntry = this.memoryCache.get(key);
      if (memoryEntry) {
        if (Date.now() < memoryEntry.expiry) {
          logger.debug('Cache hit (Memory)', { key });
          return memoryEntry.value as T;
        } else {
          // Remove expired entry
          this.memoryCache.delete(key);
        }
      }

      logger.debug('Cache miss', { key });
      return null;

    } catch (error) {
      logger.error('Cache get error', {
        key,
        error: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set<T>(key: string, value: T, type: CacheKeyType): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    try {
      const ttl = CACHE_TTL[type];
      const expiry = Date.now() + (ttl * 1000);
      const serializedValue = JSON.stringify(value);

      // Set in Redis if available
      if (this.redis) {
        await this.redis.setex(key, ttl, serializedValue);
        logger.debug('Cache set (Redis)', { key, ttl });
      }

      // Also set in memory cache as backup
      this.memoryCache.set(key, { value, expiry });
      
      // Enforce memory cache size limit
      if (this.config.memory && this.memoryCache.size > this.config.memory.maxSize) {
        this.evictOldestEntries();
      }

      logger.debug('Cache set (Memory)', { key, ttl });

    } catch (error) {
      logger.error('Cache set error', {
        key,
        type,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    try {
      // Delete from Redis if available
      if (this.redis) {
        await this.redis.del(key);
      }

      // Delete from memory cache
      this.memoryCache.delete(key);

      logger.debug('Cache delete', { key });

    } catch (error) {
      logger.error('Cache delete error', {
        key,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Delete multiple keys matching a pattern
   */
  async deletePattern(pattern: string): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    try {
      // Handle Redis pattern deletion
      if (this.redis) {
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      }

      // Handle memory cache pattern deletion
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      for (const key of this.memoryCache.keys()) {
        if (regex.test(key)) {
          this.memoryCache.delete(key);
        }
      }

      logger.debug('Cache pattern delete', { pattern });

    } catch (error) {
      logger.error('Cache pattern delete error', {
        pattern,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Generate cache key for files list
   */
  generateFilesListKey(params: FilesQueryParams, userRole: UserRole): string {
    const paramsHash = this.hashObject({
      path: params.path,
      recursive: params.recursive,
      depth: params.depth,
      type: params.type,
      extensions: params.extensions,
      exclude_patterns: params.exclude_patterns,
      sort_by: params.sort_by,
      sort_order: params.sort_order,
      page: params.page,
      per_page: params.per_page,
      include_metadata: params.include_metadata,
      include_permissions: params.include_permissions,
    });

    return CACHE_KEYS.FILES_LIST
      .replace('{path}', this.sanitizeKeyComponent(params.path))
      .replace('{params_hash}', paramsHash)
      .replace('{user_role}', userRole);
  }

  /**
   * Generate cache key for directory tree
   */
  generateTreeKey(params: TreeQueryParams, userRole: UserRole): string {
    const paramsHash = this.hashObject({
      max_depth: params.max_depth,
      lazy_load: params.lazy_load,
      expand_paths: params.expand_paths,
      include_files: params.include_files,
      file_extensions: params.file_extensions,
      exclude_hidden: params.exclude_hidden,
      include_counts: params.include_counts,
      include_permissions: params.include_permissions,
    });

    return CACHE_KEYS.TREE_STRUCTURE
      .replace('{path}', this.sanitizeKeyComponent(params.path))
      .replace('{depth}', paramsHash)
      .replace('{user_role}', userRole);
  }

  /**
   * Generate cache key for permissions
   */
  generatePermissionKey(userRole: UserRole, path: string, type: string): string {
    return CACHE_KEYS.USER_PERMISSIONS
      .replace('{user_role}', userRole)
      .replace('{path}', this.sanitizeKeyComponent(path))
      .replace('{type}', type);
  }

  /**
   * Generate cache key for user directories
   */
  generateUserDirectoriesKey(userRole: UserRole): string {
    return CACHE_KEYS.USER_DIRECTORIES
      .replace('{user_role}', userRole);
  }

  /**
   * Get TTL for cache type
   */
  getTTL(type: CacheKeyType): number {
    return CACHE_TTL[type];
  }

  /**
   * Invalidate cache for a specific path
   */
  async invalidatePathCache(path: string): Promise<void> {
    const patterns = [
      `fs:files:${this.sanitizeKeyComponent(path)}:*`,
      `fs:tree:${this.sanitizeKeyComponent(path)}:*`,
      `fs:dir:${this.sanitizeKeyComponent(path)}:*`,
      `fs:stats:${this.sanitizeKeyComponent(path)}`,
    ];

    for (const pattern of patterns) {
      await this.deletePattern(pattern);
    }

    // Also invalidate parent directory caches
    const parentPath = this.getParentPath(path);
    if (parentPath && parentPath !== path) {
      await this.invalidatePathCache(parentPath);
    }

    logger.info('Path cache invalidated', { path });
  }

  /**
   * Invalidate all user-specific caches
   */
  async invalidateUserCache(userRole: UserRole): Promise<void> {
    const patterns = [
      `fs:*:*:${userRole}`,
      `fs:perms:${userRole}:*`,
      `fs:user_dirs:${userRole}`,
    ];

    for (const pattern of patterns) {
      await this.deletePattern(pattern);
    }

    logger.info('User cache invalidated', { userRole });
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    memoryEntries: number;
    redisConnected: boolean;
    hitRatio?: number;
  } {
    return {
      memoryEntries: this.memoryCache.size,
      redisConnected: this.redis !== null,
      // Hit ratio would be calculated from metrics in a real implementation
    };
  }

  /**
   * Private helper methods
   */
  private loadConfig(): CacheConfig {
    return {
      enabled: process.env.CACHE_ENABLED !== 'false',
      redis: process.env.REDIS_URL ? {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        db: parseInt(process.env.REDIS_DB || '0'),
        password: process.env.REDIS_PASSWORD,
        maxRetries: 3,
        retryDelayOnFailover: 100,
      } : undefined,
      memory: {
        maxSize: parseInt(process.env.MEMORY_CACHE_MAX_SIZE || '1000'),
        ttlCheckInterval: parseInt(process.env.MEMORY_CACHE_TTL_CHECK_INTERVAL || '60000'),
      },
    };
  }

  private async initializeCache(): Promise<void> {
    // In a real implementation, this would initialize Redis connection
    // For now, we'll just use memory cache
    logger.info('Cache service initialized', {
      config: {
        enabled: this.config.enabled,
        hasRedis: !!this.config.redis,
        memoryMaxSize: this.config.memory?.maxSize,
      }
    });
  }

  private hashObject(obj: any): string {
    const str = JSON.stringify(obj, Object.keys(obj).sort());
    return Buffer.from(str).toString('base64url').slice(0, 16);
  }

  private sanitizeKeyComponent(component: string): string {
    // Replace characters that might cause issues in cache keys
    return component.replace(/[^a-zA-Z0-9._-]/g, '_');
  }

  private getParentPath(path: string): string | null {
    const normalized = path.replace(/^\/+|\/+$/g, '');
    if (!normalized) return null;
    
    const segments = normalized.split('/');
    if (segments.length <= 1) return '/';
    
    return '/' + segments.slice(0, -1).join('/');
  }

  private cleanupExpiredEntries(): void {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.memoryCache.entries()) {
      if (now >= entry.expiry) {
        this.memoryCache.delete(key);
        removed++;
      }
    }

    if (removed > 0) {
      logger.debug('Cleaned up expired cache entries', { removed });
    }
  }

  private evictOldestEntries(): void {
    // Simple LRU-like eviction - remove 10% of entries
    const targetSize = Math.floor((this.config.memory?.maxSize || 1000) * 0.9);
    const toRemove = this.memoryCache.size - targetSize;

    if (toRemove > 0) {
      const keys = Array.from(this.memoryCache.keys());
      for (let i = 0; i < toRemove; i++) {
        this.memoryCache.delete(keys[i]);
      }

      logger.debug('Evicted old cache entries', { removed: toRemove });
    }
  }
}