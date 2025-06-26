import { NextResponse } from 'next/server';
import { ApiResponse } from '@/app/types/api';

// Standard error response helper
export function createErrorResponse(
  error: unknown,
  status: number = 500,
  customMessage?: string
): NextResponse<ApiResponse<null>> {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
  const message = customMessage || errorMessage;
  
  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('API Error:', error);
  }
  
  return NextResponse.json(
    {
      success: false,
      data: null,
      error: message,
    },
    { status }
  );
}

// Standard success response helper
export function createSuccessResponse<T>(
  data: T,
  meta?: ApiResponse<T>['meta'],
  cacheSeconds?: number
): NextResponse<ApiResponse<T>> {
  const headers: Record<string, string> = {};
  
  if (cacheSeconds) {
    headers['Cache-Control'] = `public, s-maxage=${cacheSeconds}, stale-while-revalidate=${cacheSeconds * 2}`;
  }
  
  return NextResponse.json({
    success: true,
    data,
    meta,
  }, { headers });
}

// Input validation helper
export function validateRequiredFields(
  obj: Record<string, unknown>,
  requiredFields: string[]
): string[] {
  const missing = requiredFields.filter(field => !obj[field]);
  return missing;
}

// Environment variable validation
export function validateEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

// Rate limiting helper (basic implementation)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 60000
): boolean {
  const now = Date.now();
  const record = requestCounts.get(identifier);
  
  if (!record || now > record.resetTime) {
    requestCounts.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (record.count >= maxRequests) {
    return false;
  }
  
  record.count++;
  return true;
}