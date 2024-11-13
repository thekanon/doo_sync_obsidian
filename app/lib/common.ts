import firebase from "firebase/compat/app";
import { UserType, AUTH_STATUS_MESSAGES } from "@/app/types/auth";

/**
 * 사용자 유형을 결정하는 함수
 * @param user - Firebase 사용자 객체
 * @returns 사용자 유형을 나타내는 문자열
 */
export function getUserType(
  user: firebase.User
): "ADMIN" | "VERIFIED" | "GUEST" | "ANONYMOUS" {
  // 환경 변수의 존재 여부 확인
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

  if (adminEmail && user.email === adminEmail) {
    return "ADMIN";
  }

  if (user.emailVerified) {
    return "VERIFIED";
  }

  if (user.isAnonymous) {
    return "ANONYMOUS";
  }

  // 기본값은 guestUser(비로그인 사용자)
  return "GUEST";
}

/**
 * 사용자의 인증 상태를 반환하는 함수
 * @param user Firebase 사용자 객체
 * @returns 사용자 상태 메시지
 * @throws Error 유효하지 않은 사용자 타입일 경우
 */
export const getAuthStatus = async (user: firebase.User): Promise<string> => {
  const userType = getUserType(user) as UserType;

  const status = AUTH_STATUS_MESSAGES[userType];
  if (!status) {
    throw new Error(`Invalid user type: ${userType}`);
  }

  return status;
};
