/**
 * 페이지 권한 정보
 */
import { UserRole } from './user';

interface PagePermission {
  path: string; // 페이지 경로
  allowedRoles: UserRole[]; // 접근 가능한 권한 목록
  isPublic: boolean; // 공개 페이지 여부
}

export const pagePermissions: PagePermission[] = [
  // 모든 사용자 접근 가능
  {
    path: '/',
    allowedRoles: [],
    isPublic: true,
  },
  {
    path: '/login*',
    allowedRoles: [],
    isPublic: true,
  },
  {
    path: `/_Index_of_${process.env.OBSIDIAN_ROOT_DIR || 'Root'}*`,
    allowedRoles: [],
    isPublic: true,
  },
  {
    path: '/unauthorized',
    allowedRoles: [],
    isPublic: true,
  },
  // 어드민 권한만 접근 가능
  {
    path: '/1. 일지*',
    allowedRoles: [UserRole.ADMIN],
    isPublic: false,
  },
  {
    path: '/3. 회사*',
    allowedRoles: [UserRole.ADMIN],
    isPublic: false,
  },
  {
    path: '/*/_Index_of_커리어*',
    allowedRoles: [UserRole.ADMIN],
    isPublic: false,
  },
  {
    path: '/7. 생각정리/커리어*',
    allowedRoles: [UserRole.ADMIN],
    isPublic: false,
  },
  {
    path: '/*/_Index_of_99.일기*',
    allowedRoles: [UserRole.ADMIN],
    isPublic: false,
  },
  {
    path: '/97. 보안 폴더*',
    allowedRoles: [UserRole.ADMIN],
    isPublic: false,
  },
  {
    path: '/99. 일기*',
    allowedRoles: [UserRole.ADMIN],
    isPublic: false,
  },

  // 어드민, 인증된 사용자만 접근 가능
  {
    path: '/8. 루틴*',
    allowedRoles: [UserRole.ADMIN, UserRole.VERIFIED],
    isPublic: false,
  },
  {
    path: '/98. 미분류*',
    allowedRoles: [UserRole.ADMIN],
    isPublic: false,
  },

  // 어드민, 인증된 사용자, 게스트만 접근 가능
  // {
  //   path: "/5. 프로젝트/*",
  //   allowedRoles: [UserRole.ADMIN, UserRole.VERIFIED, UserRole.GUEST],
  //   isPublic: false,
  // },
];

export const isPublicPageList = ['/', '/login*', `/_Index_of_${process.env.OBSIDIAN_ROOT_DIR || 'Root'}*`, '/unauthorized'];
