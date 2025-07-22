// Standardized API response types
export interface ApiResponse<T> {
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    currentPath?: string;
  };
  error?: ApiErrorResponse;
  success: boolean;
}

export enum ApiErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RATE_LIMITED = 'RATE_LIMITED',
  INTERNAL_ERROR = 'INTERNAL_ERROR'
}

export interface ApiErrorResponse {
  code: ApiErrorCode;
  message: string;
  details?: Record<string, unknown>;
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