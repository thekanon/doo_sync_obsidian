/**
 * @fileoverview 유틸리티 함수들을 정의한 파일
 * 서버사이드에서 사용되는 함수들을 정의
 */
import { pagePermissions } from "../types/pagePermissions";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { User, UserRole } from "../types/user";
import { fetchAuthInfo } from "@/services/auth/authService";
import { logger } from "./logger";

/* ----------------------------- helpers ----------------------------- */
type NormalizedPath = { decodedPath: string; cleanPath: string };

const VALID_ROLES = new Set<unknown>(Object.values(UserRole));

const isValidRole = (role: unknown): role is UserRole => VALID_ROLES.has(role);

const escapeRegex = (s: string) =>
  s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const wildcardToRegex = (pattern: string) =>
  new RegExp(
    "^" +
      escapeRegex(decodeURIComponent(pattern)).replace(/\\\*/g, ".*") +
      "$"
  );

const normalizePath = (raw?: string | null): NormalizedPath | null => {
  if (!raw) return null;
  const decodedPath = decodeURIComponent(raw);

  const cleanPath = decodedPath
    .replace(new RegExp(`^/${process.env.OBSIDIAN_ROOT_DIR || "Root"}/`), "/")
    .replace(/\/_Index_of_/, "/")
    .replace(/\.md$/, "");

  return { decodedPath, cleanPath };
};


/* ----------------------------- general ----------------------------- */

// server host
export const getHost = () => {
  return process.env.SERVER_DOMAIN;
};

/**
 * 권한 체크 유틸리티 함수
 *
 * 테스트(계약)에 맞춘 규칙:
 * 1) role이 유효하지 않으면 false (단, path가 falsy이면 true)
 * 2) path가 falsy면 true
 * 3) 정의되지 않은 경로는 현재 true (기본 허용)  <-- 필요 시 false로 바꾸고 테스트 업데이트
 */
export const hasPermission = (
  userRole: UserRole | null | undefined,
  path?: string | null
): boolean => {
  if (!isValidRole(userRole)) return !path;   // 계약에 맞춘 처리

  if (!path) return true;

  const { decodedPath, cleanPath } =
    normalizePath(path) ?? { decodedPath: "", cleanPath: "" };

  const permission = pagePermissions.find((p) => {
    const regex = wildcardToRegex(p.path);
    return regex.test(decodedPath) || regex.test(cleanPath);
  });

  if (!permission) return true;

  return permission.isPublic || permission.allowedRoles.includes(userRole);
};


/**
 * 페이지가 공개 페이지인지 확인
 * - 정의되지 않은 경로는 false(공개 아님)로 반환
 */
export const isPublicPage = (path?: string | null): boolean => {
  if (!path) return false;

  const { decodedPath, cleanPath } =
    normalizePath(path) ?? { decodedPath: "", cleanPath: "" };

  const permission = pagePermissions.find((p) => {
    const regex = wildcardToRegex(p.path);
    return regex.test(decodedPath) || regex.test(cleanPath);
  });

  return permission?.isPublic ?? false;
};

/**
 * Edge Runtime 호환 공개 페이지 체크
 * 미들웨어에서 사용 가능한 간단한 경로 기반 체크
 */
export const isPublicPathEdge = (path: string): boolean => {
  const publicPaths = [
    '/login',
    '/unauthorized',
    '/robots.txt',
    '/sitemap.xml',
    '/_next',
    '/api',
    '/favicon.ico',
  ];

  return publicPaths.some(publicPath => path.startsWith(publicPath));
};

/**
 * Edge Runtime 호환 권한 체크
 * 미들웨어에서 간단한 인증 여부만 확인
 */
export const hasPermissionEdge = (isAuthenticated: boolean, path: string): boolean => {
  // 공개 페이지는 항상 허용
  if (isPublicPathEdge(path)) {
    return true;
  }

  // 비공개 페이지는 인증이 필요
  return isAuthenticated;
};


// 현재 사용자 정보 가져오기
export const getCurrentUser = async (
  request: NextRequest
): Promise<User | null> => {
  const token = request.cookies.get("token")?.value;
  if (!token) return null;

  try {
    const user = await fetchAuthInfo(token);

    if (user) {
      // env파일에 있는 NEXT_PUBLIC_ADMIN_EMAIL과 같은지 확인
      if (user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
        user.role = UserRole.ADMIN;
      }
      // 이메일 인증이 되어있는지 확인
      else if (user.emailVerified) {
        user.role = UserRole.VERIFIED;
      } else {
        user.role = UserRole.GUEST;
      }
    } else {
      throw new Error("User not found");
    }
    logger.debug("⭐️ user", user);
    return user;
  } catch (error) {
    logger.error("Error getting current user:", error);
    return null;
  }
};

// 헤더 데이터를 통해 사용자 정보 가져오기
export async function getServerUser(): Promise<User | null> {
  try {
    const headersList = headers();
    const user = headersList.get("x-user-info");
    logger.debug("🔒 user", user);
    if (!user) return null;
    return JSON.parse(user) as User;
  } catch (error) {
    logger.error("Error parsing user from headers:", error);
    return null;
  }
}

// 방문 횟수 관리
const VISIT_COUNT_COOKIE = "visitCount";

export const getVisitCount = async (request: NextRequest): Promise<number> => {
  const visitCount = request.cookies.get(VISIT_COUNT_COOKIE)?.value;
  logger.debug("💡 visitCount", visitCount);
  const count = parseInt(visitCount || "0", 10);
  return count;
};

export const incrementVisitCount = async (
  request: NextRequest
): Promise<NextResponse> => {
  const currentCount = await getVisitCount(request);
  const newCount = currentCount + 1;

  const response = NextResponse.next();

  response.cookies.set(VISIT_COUNT_COOKIE, newCount.toString(), {
    maxAge: 60 * 60 * 24, // 24시간
    path: "/",
    httpOnly: true,
    sameSite: "lax",
  });

  logger.debug("Visit count incremented:", newCount);
  return response;
};

/**
 * 방문 횟수 관리를 위한 미들웨어 헬퍼 함수
 */
export const handleVisitCount = async (
  request: NextRequest
): Promise<NextResponse | null> => {
  const currentCount = await getVisitCount(request);

  // 비공개 페이지이고 방문 횟수가 제한을 넘은 경우
  if (currentCount >= 10 && !isPublicPage(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  // 방문 횟수 증가
  const response = await incrementVisitCount(request);

  return response;
};

/**
 * 방문 횟수 초기화
 */
export const resetVisitCount = async (headersObj: Headers): Promise<NextResponse> => {
  const response = NextResponse.next({
    request: { headers: headersObj },
  });

  response.cookies.set(VISIT_COUNT_COOKIE, "0", {
    maxAge: 60 * 60 * 24, // 24시간
    path: "/",
    httpOnly: true,
    sameSite: "lax",
  });
  logger.debug("Visit count reset");
  return response;
};
