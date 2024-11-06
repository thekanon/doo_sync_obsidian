import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { UserRole } from "@/app/types/user";
import {
  getCurrentUser,
  getVisitCount,
  incrementVisitCount,
  isPublicPage,
  hasPermission,
} from "@/app/lib/utils";

export async function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  const path = request.nextUrl.pathname;

  requestHeaders.set("x-obsidian-url", "doo-brain");

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // console.log("😈 path", path);

  // 공개 리소스는 체크하지 않음
  if (path.match(/\.(ico|png|jpg|jpeg|css|js|svg)$/)) {
    return response;
  }

  const user = await getCurrentUser(request);

  // 비로그인 사용자 방문 횟수 체크
  if (!user) {
    const visitCount = await getVisitCount(request);
    if (visitCount > 5 && !isPublicPage(path)) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    incrementVisitCount(response);
    console.log("visitCount", visitCount);
  } else {
    console.log("user.role", user.role);
  }

  // 페이지 권한 체크
  if (!hasPermission(user?.role as UserRole, path)) {
    console.log("👮‍♂️ permission check failed");
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }
  console.log("👮‍♂️ permission check");
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
