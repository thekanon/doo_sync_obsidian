import { useMemo } from "react";

export function getUserIcon(userType: string): string {
  switch (userType) {
    case "관리자":
      return "👑";
    case "이메일 인증 사용자":
      return "✉️";
    case "게스트 사용자":
      return "👤";
    default:
      return "🔒";
  }
}

export function useUserIcon(userType: string): string {
  return useMemo(() => getUserIcon(userType), [userType]);
}