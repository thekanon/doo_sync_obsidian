/**
 * @fileoverview Next.js 미들웨어
 * Edge Runtime에서 실행되며, 보안 헤더 설정 및 기본 인증 체크를 수행합니다.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { logger } from "./app/lib/logger";
import { addSecurityHeaders } from "./app/lib/securityHeaders";
import { hasPermissionEdge } from "./app/lib/utils";

/**
 * 정적 리소스 체크
 */
const isStaticResource = (path: string): boolean => {
  return /\.(ico|png|jpg|jpeg|css|js|svg)$/.test(path);
};

/**
 * 세션 쿠키를 통한 인증 상태 확인
 */
const checkAuthentication = (request: NextRequest): boolean => {
  const sessionCookie = request.cookies.get('session')?.value;
  return !!sessionCookie;
};

/**
 * 미들웨어 메인 함수
 */
export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  logger.middleware.debug("Processing request", { path });

  // 정적 리소스는 보안 헤더만 추가하고 바로 통과
  if (isStaticResource(path)) {
    const response = NextResponse.next();
    addSecurityHeaders(response);
    return response;
  }

  // 요청 헤더 설정
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-obsidian-url", process.env.OBSIDIAN_URL || "obsidian");

  // 인증 상태 확인
  const isAuthenticated = checkAuthentication(request);

  if (isAuthenticated) {
    logger.middleware.debug("User authenticated");
    requestHeaders.set("x-user-info", JSON.stringify({
      role: 'authenticated',
      authenticated: true
    }));
  }

  // 권한 체크
  if (!hasPermissionEdge(isAuthenticated, path)) {
    logger.middleware.debug("Permission denied", { path });
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  // 최종 응답 생성
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  addSecurityHeaders(response);
  logger.middleware.debug("Request processed successfully");

  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!api|_next/static|_next/image|favicon\\.ico|.*\\.svg$).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};