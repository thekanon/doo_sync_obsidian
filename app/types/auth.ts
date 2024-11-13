/**
 * @deprecated 타입 안정성을 위해 이거 대신 타입을 바로 사용할 예정
 */
export interface FirebaseUser {
  uid: string;
  email: string;
  emailVerified: boolean;
  displayName: string;
  isAnonymous: boolean;
  photoURL: string;
  providerData: ProviderData[];
  stsTokenManager: StsTokenManager;
  createdAt: string;
  lastLoginAt: string;
  apiKey: string;
  appName: string;
}

interface ProviderData {
  providerId: string;
  uid: string;
  displayName: string;
  email: string;
  phoneNumber: null | string;
  photoURL: string;
}

interface StsTokenManager {
  refreshToken: string;
  accessToken: string;
  expirationTime: number;
}

// 사용자 타입을 상수로 정의
const USER_TYPES = {
  ADMIN: "ADMIN",
  VERIFIED: "VERIFIED",
  GUEST: "GUEST",
  ANONYMOUS: "ANONYMOUS",
} as const;

// 사용자 타입에 따른 상태 메시지 매핑
export const AUTH_STATUS_MESSAGES = {
  [USER_TYPES.ADMIN]: "관리자",
  [USER_TYPES.VERIFIED]: "이메일 인증 사용자",
  [USER_TYPES.GUEST]: "로그인 필요",
  [USER_TYPES.ANONYMOUS]: "익명 사용자",
} as const;

// 사용자 타입을 TypeScript 타입으로 정의
export type UserType = keyof typeof AUTH_STATUS_MESSAGES;
