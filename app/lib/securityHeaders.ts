/**
 * @fileoverview 보안 헤더 관리 유틸리티
 * Edge Runtime 호환
 */

import { NextResponse } from "next/server";
import type { SecurityHeaders } from "../types/middleware";

/**
 * 기본 보안 헤더 설정
 */
export const SECURITY_HEADERS: SecurityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

/**
 * CSP(Content Security Policy) 값 생성
 * 개발 환경과 프로덕션 환경에 따라 다른 정책 적용
 */
export const getCSPValues = (): string => {
  const baseCSP = [
    "default-src 'self'",
    "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
    "font-src 'self' fonts.gstatic.com",
    "img-src 'self' data: blob:",
    "connect-src 'self' *.firebase.com *.firebaseio.com *.googleapis.com",
    "frame-ancestors 'none'",
    "base-uri 'self'"
  ];

  // 개발/프로덕션 모두에서 Firebase와 Google API를 위한 script-src 필요
  baseCSP.push("script-src 'self' 'unsafe-inline' 'unsafe-eval' *.firebaseapp.com *.googleapis.com");

  return baseCSP.join('; ');
};

/**
 * NextResponse에 보안 헤더 추가
 * @param response - NextResponse 객체
 */
export const addSecurityHeaders = (response: NextResponse): void => {
  // 기본 보안 헤더 설정
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // HSTS (프로덕션 환경에서만)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  // CSP 헤더 설정
  response.headers.set('Content-Security-Policy', getCSPValues());
};
