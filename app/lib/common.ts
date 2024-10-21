import firebase from "firebase/compat/app";

/**
 * 사용자 유형을 결정하는 함수
 * @param user - Firebase 사용자 객체
 * @returns 사용자 유형을 나타내는 문자열
 */
export function getUserType(
  user: firebase.User
): "admin" | "emailUser" | "guestUser" | "anonymousUser" {
  // 환경 변수의 존재 여부 확인
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

  if (adminEmail && user.email === adminEmail) {
    return "admin";
  }

  if (user.emailVerified) {
    return "emailUser";
  }

  if (user.isAnonymous) {
    return "anonymousUser";
  }

  // 기본값은 guestUser(비로그인 사용자)
  return "guestUser";
}
