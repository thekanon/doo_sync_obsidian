/**
 * @fileoverview Middleware 관련 타입 정의
 */

/**
 * 보안 헤더 설정 타입
 */
export interface SecurityHeaders {
  'X-Content-Type-Options': string;
  'X-Frame-Options': string;
  'X-XSS-Protection': string;
  'Referrer-Policy': string;
}

/**
 * CSP 정책 타입
 */
export interface CSPPolicy {
  defaultSrc: string[];
  styleSrc: string[];
  fontSrc: string[];
  imgSrc: string[];
  connectSrc: string[];
  scriptSrc: string[];
  frameAncestors: string[];
  baseUri: string[];
}
