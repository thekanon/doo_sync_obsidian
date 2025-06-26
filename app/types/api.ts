// Standardized API response types
export interface ApiResponse<T> {
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    currentPath?: string;
  };
  error?: string;
  success: boolean;
}

export interface ApiError extends Error {
  code?: string;
  status?: number;
}

// Common request/response types
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface FileInfo {
  name: string;
  path: string;
  modifiedAt: Date;
  category: string;
  isDirectory?: boolean;
}

// API specific response types
export interface RecentPost {
  title: string;
  path: string;
  category: string;
  date: string;
}

export interface PopularPost {
  title: string;
  path: string;
  category: string;
  subcategory?: string;
  views?: number;
}

export interface LinkItem {
  title: string;
  url: string;
  description?: string;
}

export interface DirectoryItem {
  name: string;
  path: string;
  isDirectory: boolean;
  modifiedAt?: string;
}