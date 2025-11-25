/**
 * @fileoverview API 에러 처리 유틸리티
 * 일관된 에러 응답을 위한 헬퍼 함수들
 */

import { NextResponse } from "next/server";
import { logger } from "./logger";

/**
 * API 에러 응답 타입
 */
export interface ApiErrorResponse {
  error: string;
  message?: string;
  details?: unknown;
}

/**
 * 에러 상태 코드와 메시지 매핑
 */
export enum ApiErrorCode {
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  INTERNAL_SERVER_ERROR = 500,
}

/**
 * 표준화된 에러 응답 생성
 */
export function createErrorResponse(
  error: string,
  statusCode: ApiErrorCode = ApiErrorCode.INTERNAL_SERVER_ERROR,
  message?: string,
  details?: unknown
): NextResponse<ApiErrorResponse> {
  const errorResponse: ApiErrorResponse = {
    error,
    message,
    details: process.env.NODE_ENV === 'development' ? details : undefined,
  };

  logger.api.error(`API Error: ${error}`, { statusCode, message, details });

  return NextResponse.json(errorResponse, { status: statusCode });
}

/**
 * 에러 객체를 API 응답으로 변환
 */
export function handleApiError(
  error: unknown,
  context?: string
): NextResponse<ApiErrorResponse> {
  const contextMsg = context ? `[${context}] ` : '';

  if (error instanceof Error) {
    logger.api.error(`${contextMsg}${error.message}`, { stack: error.stack });
    return createErrorResponse(
      'Internal server error',
      ApiErrorCode.INTERNAL_SERVER_ERROR,
      error.message
    );
  }

  logger.api.error(`${contextMsg}Unknown error`, { error });
  return createErrorResponse(
    'Internal server error',
    ApiErrorCode.INTERNAL_SERVER_ERROR,
    'An unknown error occurred'
  );
}

/**
 * 요청 검증 에러
 */
export function validationError(message: string): NextResponse<ApiErrorResponse> {
  return createErrorResponse('Validation error', ApiErrorCode.BAD_REQUEST, message);
}

/**
 * 인증 에러
 */
export function unauthorizedError(message: string = 'Unauthorized'): NextResponse<ApiErrorResponse> {
  return createErrorResponse('Unauthorized', ApiErrorCode.UNAUTHORIZED, message);
}

/**
 * 권한 에러
 */
export function forbiddenError(message: string = 'Forbidden'): NextResponse<ApiErrorResponse> {
  return createErrorResponse('Forbidden', ApiErrorCode.FORBIDDEN, message);
}

/**
 * 리소스 없음 에러
 */
export function notFoundError(message: string = 'Not found'): NextResponse<ApiErrorResponse> {
  return createErrorResponse('Not found', ApiErrorCode.NOT_FOUND, message);
}
