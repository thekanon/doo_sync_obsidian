import { pagePermissions } from "../types/page";
import { NextRequest, NextResponse } from "next/server";
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

  console.log("🔒 path", decodedPath);
  console.log("🔒 permission", permission);

  if (!permission) return true; // 정의되지 않은 경로는 기본적으로 접근 허용
  return permission.allowedRoles.includes(userRole || UserRole.ANONYMOUS);
};

// 페이지가 공개 페이지인지 확인
export const isPublicPage = (path: string): boolean => {
  const permission = pagePermissions.find((p) => path.startsWith(p.path));
  return permission?.isPublic ?? true;
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
    // console.log("⭐️ user", user);
    if (user) {
      // env파일에 있는 NEXT_PUBLIC_ADMIN_EMAIL과 같은지 확인
      if (user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
        user.role = UserRole.ADMIN;
      }
      // 이메일 인증이 되어있는지 확인
      else if (user.emailVerified) {
        user.role = UserRole.VERIFIED;
      } else if (user.isAnonymous) {
        user.role = UserRole.GUEST;
      }
    } else {
      throw new Error("User not found");
    }

    return user;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
};

// 방문 횟수 관리
export const getVisitCount = async (request: NextRequest): Promise<number> => {
  const visitCount = request.cookies.get("visitCount")?.value;
  return parseInt(visitCount || "0", 10);
};

export const incrementVisitCount = (response: NextResponse): void => {
  const currentCount = parseInt(
    response.cookies.get("visitCount")?.value || "0",
    10
  );
  console.log("currentCount before increment", currentCount);
  const newCount = currentCount + 1;
  response.cookies.set("visitCount", newCount.toString(), {
    maxAge: 60 * 60 * 24, // 24시간
    path: "/",
    httpOnly: true,
  });
  console.log("currentCount after increment", newCount);
};
