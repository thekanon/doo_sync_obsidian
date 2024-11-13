/**
 * @fileoverview 유틸리티 함수들을 정의한 파일
 * 서버사이드에서 사용되는 함수들을 정의
 */
import { pagePermissions } from "../types/pagePermissions";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { User, UserRole } from "../types/user";
import { fetchAuthInfo } from "@/services/auth/authService";

// server host
export const getHost = () => {
  return process.env.SERVER_DOMAIN;
};

// 권한 체크 유틸리티 함수
export const hasPermission = (
  userRole: UserRole | undefined,
  path: string
): boolean => {
  const decodedPath = decodeURIComponent(path);

  const permission = pagePermissions.find((p) => {
    // `p.path`도 디코딩하고, 와일드카드(*)를 정규식 패턴으로 변환
    const regexPattern = new RegExp(
      `^${decodeURIComponent(p.path).replace(/\*/g, ".*")}$`
    );

    return regexPattern.test(decodedPath);
  });

  console.log("🔒 permission", permission);
  console.log("🔒 path", decodedPath);

  if (!permission) return true; // 정의되지 않은 경로는 기본적으로 접근 허용
  return (
    permission.allowedRoles.includes(userRole || UserRole.ANONYMOUS) ||
    permission?.isPublic
  );
};

// 페이지가 공개 페이지인지 확인
export const isPublicPage = (path: string): boolean => {
  const decodedPath = decodeURIComponent(path);

  const permission = pagePermissions.find((p) => {
    // `p.path`도 디코딩하고, 와일드카드(*)를 정규식 패턴으로 변환
    const regexPattern = new RegExp(
      `^${decodeURIComponent(p.path).replace(/\*/g, ".*")}$`
    );

    return regexPattern.test(decodedPath);
  });
  console.log("🔒 path", path);
  console.log("🔒 permissionpermission", permission);

  return permission?.isPublic ?? false;
};

// 현재 사용자 정보 가져오기
export const getCurrentUser = async (
  request: NextRequest
): Promise<User | null> => {
  const token = request.cookies.get("token")?.value;
  // console.log("💻 token", token);
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
    console.log("⭐️ user", user);
    return user;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
};

// 헤더 데이터를 통해 사용자 정보 가져오기
export async function getServerUser(): Promise<User | null> {
  try {
    const headersList = headers();
    const user = headersList.get("x-user-info");
    if (!user) return null;
    return JSON.parse(user) as User;
  } catch (error) {
    console.error("Error parsing user from headers:", error);
    return null;
  }
}

// 방문 횟수 관리
const VISIT_COUNT_COOKIE = "visitCount";

export const getVisitCount = async (request: NextRequest): Promise<number> => {
  const visitCount = request.cookies.get(VISIT_COUNT_COOKIE)?.value;
  console.log("💡 visitCount", visitCount);
  const count = parseInt(visitCount || "0", 10);
  return count;
};

export const incrementVisitCount = async (
  request: NextRequest
): Promise<NextResponse> => {
  const currentCount = await getVisitCount(request); // 'await' 추가
  const newCount = currentCount + 1;

  // 새로운 응답 객체 생성
  // 새로운 응답 객체 생성
  const response = NextResponse.next();

  // 새로운 쿠키 설정
  response.cookies.set(VISIT_COUNT_COOKIE, newCount.toString(), {
    maxAge: 60 * 60 * 24, // 24시간
    path: "/",
    httpOnly: true,
    sameSite: "lax",
  });

  console.log("Visit count incremented:", newCount);
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
  if (currentCount >= 5 && !isPublicPage(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  // 방문 횟수 증가
  const response = await incrementVisitCount(request);

  return response;
};

/**
 * 방문 횟수 초기화
 */
/**
 * 방문 횟수 초기화
 */
export const resetVisitCount = async (): Promise<NextResponse> => {
  const response = NextResponse.next();

  // 쿠키 삭제 시 옵션 명시적으로 설정
  response.cookies.set(VISIT_COUNT_COOKIE, "0", {
    maxAge: 60 * 60 * 24, // 24시간
    path: "/",
    httpOnly: true,
    sameSite: "lax",
  });
  console.log("Visit count reset");
  return response;
};
