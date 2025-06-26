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