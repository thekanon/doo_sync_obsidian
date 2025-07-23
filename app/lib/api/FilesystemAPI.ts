import { FilesQueryParams, FilesResponse } from '@/app/api/v1/filesystem/files/route';
import { TreeQueryParams, TreeResponse } from '@/app/api/v1/filesystem/tree/route';

export interface SearchParams {
  q: string;
  search_in?: 'name' | 'content' | 'both';
  path?: string;
  type?: 'file' | 'directory' | 'all';
  extensions?: string[];
  case_sensitive?: boolean;
  whole_words?: boolean;
  regex?: boolean;
  created_after?: string;
  created_before?: string;
  modified_after?: string;
  modified_before?: string;
  page?: number;
  per_page?: number;
}

export interface SearchResult {
  item: any; // FileInfo
  relevance_score: number;
  matches: SearchMatch[];
}

export interface SearchMatch {
  field: 'name' | 'content' | 'metadata';
  snippet: string;
  line_number?: number;
}

export interface SearchResponse {
  results: SearchResult[];
  pagination: {
    current_page: number;
    per_page: number;
    total_items: number;
    total_pages: number;
    has_next: boolean;
    has_previous: boolean;
  };
  search_metadata: {
    query: string;
    total_matches: number;
    search_time_ms: number;
  };
}

export class FilesystemAPI {
  private baseUrl: string;

  constructor() {
    this.baseUrl = '/api/v1/filesystem';
  }

  /**
   * Get files and directories with filtering and pagination
   */
  async getFiles(params: Partial<FilesQueryParams> = {}): Promise<FilesResponse> {
    const url = new URL(`${this.baseUrl}/files`, window.location.origin);
    
    // Add parameters to URL
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          url.searchParams.set(key, value.join(','));
        } else {
          url.searchParams.set(key, String(value));
        }
      }
    });

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'same-origin',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error?.message || 'API request failed');
    }

    return result.data;
  }

  /**
   * Get directory tree structure
   */
  async getTree(params: Partial<TreeQueryParams> = {}): Promise<TreeResponse> {
    const url = new URL(`${this.baseUrl}/tree`, window.location.origin);
    
    // Add parameters to URL
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          url.searchParams.set(key, value.join(','));
        } else {
          url.searchParams.set(key, String(value));
        }
      }
    });

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'same-origin',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error?.message || 'API request failed');
    }

    return result.data;
  }

  /**
   * Search files and directories
   */
  async search(params: SearchParams): Promise<SearchResponse> {
    const url = new URL(`${this.baseUrl}/search`, window.location.origin);
    
    // Add parameters to URL
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          url.searchParams.set(key, value.join(','));
        } else {
          url.searchParams.set(key, String(value));
        }
      }
    });

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'same-origin',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error?.message || 'API request failed');
    }

    return result.data;
  }

  /**
   * Get detailed information about a specific directory
   */
  async getDirectoryInfo(path: string, includeChildren = true): Promise<any> {
    const encodedPath = encodeURIComponent(path);
    const url = new URL(`${this.baseUrl}/directories/${encodedPath}`, window.location.origin);
    
    if (includeChildren) {
      url.searchParams.set('include_children', 'true');
    }
    url.searchParams.set('include_stats', 'true');

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'same-origin',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error?.message || 'API request failed');
    }

    return result.data;
  }

  /**
   * Check permissions for a specific path
   */
  async checkPermissions(path: string): Promise<any> {
    const encodedPath = encodeURIComponent(path);
    const url = new URL(`${this.baseUrl}/permissions/${encodedPath}`, window.location.origin);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'same-origin',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error?.message || 'API request failed');
    }

    return result.data;
  }

  /**
   * Load lazy tree node children
   */
  async loadTreeChildren(path: string, depth = 1): Promise<TreeResponse> {
    return this.getTree({
      path,
      max_depth: depth,
      lazy_load: true,
      include_files: false,
      include_counts: true,
    });
  }

  /**
   * Get file content (for when integrating with existing file viewing system)
   */
  async getFileContent(path: string): Promise<any> {
    // This would integrate with the existing file content API
    // For now, redirect to existing system
    const response = await fetch(`/api/${path.split('/').map(encodeURIComponent).join('/')}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'same-origin',
    });

    if (!response.ok) {
      throw new Error(`Failed to load file content: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Invalidate cache for a specific path (admin only)
   */
  async invalidateCache(path: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/cache/invalidate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'same-origin',
      body: JSON.stringify({ path }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || 'Cache invalidation failed');
    }
  }
}