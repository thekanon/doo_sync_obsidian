import { User as FirebaseUser } from "firebase/auth";

export enum UserRole {
  ADMIN = "ADMIN", // 관리자
  VERIFIED = "VERIFIED", // 이메일 인증 사용자
  GUEST = "GUEST", // 비인증 사용자
  ANONYMOUS = "ANONYMOUS", // 비로그인 사용자
}

export interface User extends FirebaseUser {
  role?: UserRole;
  isEmailVerified?: boolean;
  visitCount?: number; // 비로그인 사용자의 방문 횟수
}
