import { UserRole } from "./user";

interface PagePermission {
  path: string; // 페이지 경로
  allowedRoles: UserRole[]; // 접근 가능한 권한 목록
  isPublic: boolean; // 공개 페이지 여부
}

export const pagePermissions: PagePermission[] = [
  // 어드민 권한만 접근 가능
  {
    path: "/1. 일지/*",
    allowedRoles: [UserRole.ADMIN],
    isPublic: false,
  },
  {
    path: "/3. 회사/*",
    allowedRoles: [UserRole.ADMIN],
    isPublic: false,
  },
  {
    path: "/97. 보안 폴더/*",
    allowedRoles: [UserRole.ADMIN],
    isPublic: false,
  },
  {
    path: "/99. 일기/*",
    allowedRoles: [UserRole.ADMIN],
    isPublic: false,
  },

  // 어드민, 인증된 사용자만 접근 가능
  {
    path: "/5. 프로젝트/*",
    allowedRoles: [UserRole.ADMIN, UserRole.VERIFIED],
    isPublic: false,
  },
  {
    path: "/8. 루틴/*",
    allowedRoles: [UserRole.ADMIN, UserRole.VERIFIED],
    isPublic: false,
  },
  {
    path: "/98. 미분류/*",
    allowedRoles: [UserRole.ADMIN, UserRole.VERIFIED],
    isPublic: false,
  },

  // 어드민, 인증된 사용자, 게스트만 접근 가능
  {
    path: "/5. 프로젝트/*",
    allowedRoles: [UserRole.ADMIN, UserRole.VERIFIED, UserRole.GUEST],
    isPublic: false,
  },
];
