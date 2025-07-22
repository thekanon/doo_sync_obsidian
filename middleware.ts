import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { logger } from "@/app/lib/logger";
import { UserRole } from "@/app/types/user";
import {
  getCurrentUser,
  isPublicPage,
  hasPermission,
  resetVisitCount,
  handleVisitCount,
} from "@/app/lib/utils";
import { isPublicPageList } from "@/app/types/pagePermissions";

// Common security headers configuration
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

const CSP_VALUES = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' *.firebaseapp.com *.googleapis.com",
  "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
  "font-src 'self' fonts.gstatic.com",
  "img-src 'self' data: blob:",
  "connect-src 'self' *.firebase.com *.firebaseio.com *.googleapis.com",
  "frame-ancestors 'none'",
  "base-uri 'self'"
].join('; ');

function addSecurityHeaders(response: NextResponse) {
  // Add common security headers
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  // HSTS for production
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  // Content Security Policy
  response.headers.set('Content-Security-Policy', CSP_VALUES);
}

export async function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  const path = request.nextUrl.pathname;

  requestHeaders.set("x-obsidian-url", process.env.OBSIDIAN_URL || "obsidian");

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  
  addSecurityHeaders(response);

  // 공개 리소스는 체크하지 않음
  if (path.match(/\.(ico|png|jpg|jpeg|css|js|svg)$/)) {
    return response;
  }

  const user = await getCurrentUser(request);

  // user 정보를 헤더에 추가
  if (user) {
    const userInfo = {
      id: user.uid,
      role: user.role,
    };
    logger.debug("😈 userInfo", userInfo);
    requestHeaders.set("x-user-info", JSON.stringify(userInfo));
  }

  // 비로그인 사용자 방문 횟수 체크
  if (!user) {
    // 공개 페이지는 방문 횟수 체크하지 않음
    if (isPublicPage(path)) {
      return response;
    }

    // 그 외에는 방문 횟수 체크 하여 방문 횟수가 10회 이상이면 리다이렉트
    await handleVisitCount(request);
  } else {
    logger.debug("user.role", user.role);
  }

  // 페이지 권한 체크하여 권한이 없는 경우 리다이렉트
  if (!hasPermission(user?.role as UserRole, path)) {
    logger.debug("👮‍♂️ permission check failed");
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }
  logger.debug("👮‍♂️ permission check");

  // 새로운 response 객체 생성 with security headers
  const finalResponse = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  
  addSecurityHeaders(finalResponse);
  logger.debug("🚀 middleware");
  // 방문 횟수 초기화
  const resetResponse = await resetVisitCount(requestHeaders);
  if (resetResponse) return resetResponse;
  return finalResponse;
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
