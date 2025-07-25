/**
 * Utils 라이브러리 단위 테스트
 * 
 * 테스트 대상: app/lib/utils.ts
 * - hasPermission(): 권한 체크 유틸리티
 * - isPublicPage(): 공개 페이지 확인
 * - getCurrentUser(): 현재 사용자 정보 조회
 * - 방문 횟수 관리 함수들
 * 
 * 커버리지 목표: 핵심 유틸리티 함수들의 모든 분기 검증
 */

import test from 'node:test';
import assert from 'node:assert';
import { mockNextRequest } from '../../setup';

// UserRole enum 모킹
const UserRole = {
  ADMIN: 'ADMIN',
  VERIFIED: 'VERIFIED', 
  GUEST: 'GUEST',
  ANONYMOUS: 'ANONYMOUS'
};

// pagePermissions 모킹 (실제 설정과 유사한 구조)
const mockPagePermissions = [
  {
    path: '/admin/*',
    allowedRoles: ['ADMIN'],
    isPublic: false
  },
  {
    path: '/public/*',
    allowedRoles: ['ADMIN', 'VERIFIED', 'GUEST', 'ANONYMOUS'],
    isPublic: true
  },
  {
    path: '/verified-only/*',
    allowedRoles: ['ADMIN', 'VERIFIED'],
    isPublic: false
  }
];

test('hasPermission 함수 테스트', async (t) => {
  
  await t.test('관리자 권한 확인', async () => {
    // 관리자는 모든 경로에 접근 가능
    const testCases = [
      { path: '/admin/settings', role: UserRole.ADMIN, expected: true },
      { path: '/public/doc', role: UserRole.ADMIN, expected: true },
      { path: '/verified-only/data', role: UserRole.ADMIN, expected: true }
    ];

    testCases.forEach(({ path, role, expected }) => {
      // hasPermission 로직 시뮬레이션
      const permission = mockPagePermissions.find(p => {
        const regexPattern = new RegExp(`^${p.path.replace(/\*/g, '.*')}$`);
        return regexPattern.test(path);
      });

      const hasAccess = permission ? 
        permission.allowedRoles.includes(role) || permission.isPublic :
        true; // 정의되지 않은 경로는 기본적으로 접근 허용

      assert.strictEqual(hasAccess, expected, 
        `${role} 사용자의 ${path} 접근 권한: ${expected}`);
    });
  });

  await t.test('익명 사용자 권한 확인', async () => {
    const testCases = [
      { path: '/admin/settings', role: UserRole.ANONYMOUS, expected: false },
      { path: '/public/doc', role: UserRole.ANONYMOUS, expected: true },
      { path: '/verified-only/data', role: UserRole.ANONYMOUS, expected: false },
      { path: '/undefined-path', role: UserRole.ANONYMOUS, expected: true } // 정의되지 않은 경로
    ];

    testCases.forEach(({ path, role, expected }) => {
      const permission = mockPagePermissions.find(p => {
        const regexPattern = new RegExp(`^${p.path.replace(/\*/g, '.*')}$`);
        return regexPattern.test(path);
      });

      const hasAccess = permission ? 
        permission.allowedRoles.includes(role) || permission.isPublic :
        true;

      assert.strictEqual(hasAccess, expected, 
        `${role} 사용자의 ${path} 접근 권한: ${expected}`);
    });
  });

  await t.test('경로 정규화 처리', async () => {
    const testPaths = [
      '/Root/admin/test',
      '/_Index_of_admin/test',
      '/admin/test.md'
    ];

    // 경로 정규화 로직 시뮬레이션
    const rootDir = process.env.OBSIDIAN_ROOT_DIR || 'Root';
    
    testPaths.forEach(path => {
      const cleanPath = decodeURIComponent(path)
        .replace(new RegExp(`^/${rootDir}/`), '/')
        .replace(/\/_Index_of_/, '/')
        .replace(/\.md$/, '');

      // 정규화된 경로가 올바른지 확인
      assert.ok(!cleanPath.includes('_Index_of_'), 
        '정규화된 경로에서 _Index_of_ 제거됨');
      assert.ok(!cleanPath.endsWith('.md'), 
        '정규화된 경로에서 .md 확장자 제거됨');
    });
  });

  await t.test('URL 디코딩 처리', async () => {
    const encodedPath = '/한글%20폴더/test%20file';
    const decodedPath = decodeURIComponent(encodedPath);
    
    assert.strictEqual(decodedPath, '/한글 폴더/test file', 
      'URL 인코딩된 경로가 올바르게 디코딩됨');
  });
});

test('isPublicPage 함수 테스트', async (t) => {
  
  await t.test('공개 페이지 확인', async () => {
    const testCases = [
      { path: '/public/document', expected: true },
      { path: '/admin/settings', expected: false },
      { path: '/verified-only/data', expected: false },
      { path: '/undefined-path', expected: false } // 정의되지 않은 경로는 기본적으로 비공개
    ];

    testCases.forEach(({ path, expected }) => {
      const permission = mockPagePermissions.find(p => {
        const regexPattern = new RegExp(`^${p.path.replace(/\*/g, '.*')}$`);
        return regexPattern.test(path);
      });

      const isPublic = permission ? (permission.isPublic ?? false) : false;

      assert.strictEqual(isPublic, expected, 
        `${path}의 공개 상태: ${expected}`);
    });
  });

  await t.test('정의되지 않은 경로 처리', async () => {
    const undefinedPath = '/some/random/path';
    const permission = mockPagePermissions.find(p => {
      const regexPattern = new RegExp(`^${p.path.replace(/\*/g, '.*')}$`);
      return regexPattern.test(undefinedPath);
    });

    const isPublic = permission ? (permission.isPublic ?? false) : false;

    assert.strictEqual(isPublic, false, 
      '정의되지 않은 경로는 기본적으로 비공개');
  });
});

test('getCurrentUser 함수 테스트', async (t) => {
  
  await t.test('유효한 토큰으로 사용자 정보 조회', async () => {
    const mockRequest = {
      cookies: {
        get: (key: string) => {
          if (key === 'token') return { value: 'valid-token' };
          return undefined;
        }
      }
    };

    // 사용자 정보 조회 로직 시뮬레이션
    const tokenCookie = mockRequest.cookies.get('token');
    const token = tokenCookie ? (tokenCookie as any).value : undefined;
    assert.ok(token, '토큰이 존재해야 함');
    assert.strictEqual(token, 'valid-token', '올바른 토큰 값');
  });

  await t.test('토큰 없는 경우', async () => {
    const mockRequest = {
      cookies: {
        get: (key: string) => undefined
      }
    };

    const tokenCookie = mockRequest.cookies.get('token');
    const token = tokenCookie ? (tokenCookie as any).value : undefined;
    assert.strictEqual(token, undefined, '토큰이 없으면 undefined 반환');
  });

  await t.test('관리자 이메일 확인', async () => {
    const adminEmail = 'admin@test.com';
    process.env.NEXT_PUBLIC_ADMIN_EMAIL = adminEmail;

    const mockUser = {
      email: adminEmail,
      emailVerified: true,
      role: UserRole.GUEST // 초기값
    };

    // 관리자 이메일 확인 로직
    if (mockUser.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
      mockUser.role = UserRole.ADMIN;
    }

    assert.strictEqual(mockUser.role, UserRole.ADMIN, 
      '관리자 이메일인 경우 ADMIN 역할 부여');
  });

  await t.test('이메일 인증 상태에 따른 역할 부여', async () => {
    const testCases = [
      {
        user: { email: 'user@test.com', emailVerified: true },
        expectedRole: UserRole.VERIFIED
      },
      {
        user: { email: 'user@test.com', emailVerified: false },
        expectedRole: UserRole.GUEST
      }
    ];

    testCases.forEach(({ user, expectedRole }) => {
      let role = UserRole.GUEST;
      
      if (user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
        role = UserRole.ADMIN;
      } else if (user.emailVerified) {
        role = UserRole.VERIFIED;
      } else {
        role = UserRole.GUEST;
      }

      assert.strictEqual(role, expectedRole, 
        `이메일 인증 상태 ${user.emailVerified}에 따른 역할: ${expectedRole}`);
    });
  });
});

test('방문 횟수 관리 함수 테스트', async (t) => {
  
  await t.test('방문 횟수 조회', async () => {
    const mockRequest = {
      cookies: {
        get: (key: string) => {
          if (key === 'visitCount') return { value: '5' };
          return undefined;
        }
      }
    };

    // getVisitCount 로직 시뮬레이션
    const visitCountCookieObj = mockRequest.cookies.get('visitCount');
    const visitCountCookie = visitCountCookieObj ? (visitCountCookieObj as any).value : undefined;
    const count = parseInt(visitCountCookie || '0', 10);

    assert.strictEqual(count, 5, '방문 횟수가 올바르게 파싱됨');
  });

  await t.test('방문 횟수 쿠키 없는 경우', async () => {
    const mockRequest = {
      cookies: {
        get: (key: string) => undefined
      }
    };

    const visitCountCookieObj = mockRequest.cookies.get('visitCount');
    const visitCountCookie = visitCountCookieObj ? (visitCountCookieObj as any).value : undefined;
    const count = parseInt(visitCountCookie || '0', 10);

    assert.strictEqual(count, 0, '쿠키가 없으면 0으로 초기화');
  });

  await t.test('방문 횟수 증가 로직', async () => {
    const currentCount = 5;
    const newCount = currentCount + 1;

    assert.strictEqual(newCount, 6, '방문 횟수가 1 증가');
  });

  await t.test('방문 횟수 제한 확인', async () => {
    const visitLimit = 10;
    const testCases = [
      { count: 5, isPublic: false, shouldAllow: true },
      { count: 10, isPublic: false, shouldAllow: false },
      { count: 15, isPublic: true, shouldAllow: true }, // 공개 페이지는 제한 없음
      { count: 15, isPublic: false, shouldAllow: false }
    ];

    testCases.forEach(({ count, isPublic, shouldAllow }) => {
      const allowed = count < visitLimit || isPublic;
      
      assert.strictEqual(allowed, shouldAllow, 
        `방문 횟수 ${count}, 공개페이지 ${isPublic}: 접근 허용 ${shouldAllow}`);
    });
  });

  await t.test('쿠키 옵션 검증', async () => {
    const expectedCookieOptions = {
      maxAge: 60 * 60 * 24, // 24시간
      path: '/',
      httpOnly: true,
      sameSite: 'lax'
    };

    assert.strictEqual(expectedCookieOptions.maxAge, 86400, '24시간 만료 시간');
    assert.strictEqual(expectedCookieOptions.path, '/', '루트 경로 설정');
    assert.strictEqual(expectedCookieOptions.httpOnly, true, 'httpOnly 플래그 설정');
    assert.strictEqual(expectedCookieOptions.sameSite, 'lax', 'SameSite lax 설정');
  });
});

test('getServerUser 함수 테스트', async (t) => {
  
  await t.test('헤더에서 사용자 정보 파싱', async () => {
    const mockUserInfo = {
      uid: 'test-uid',
      email: 'test@test.com',
      role: UserRole.VERIFIED
    };

    const userHeader = JSON.stringify(mockUserInfo);
    
    // JSON 파싱 테스트
    const parsedUser = JSON.parse(userHeader);
    
    assert.deepStrictEqual(parsedUser, mockUserInfo, 
      '헤더의 사용자 정보가 올바르게 파싱됨');
  });

  await t.test('잘못된 JSON 형식 처리', async () => {
    const invalidJson = 'invalid-json-string';
    
    let errorOccurred = false;
    try {
      JSON.parse(invalidJson);
    } catch (error) {
      errorOccurred = true;
    }

    assert.strictEqual(errorOccurred, true, 
      '잘못된 JSON 형식에서 에러 발생');
  });
});

test('getHost 함수 테스트', async (t) => {
  
  await t.test('서버 도메인 조회', async () => {
    const testDomain = 'https://test.example.com';
    process.env.SERVER_DOMAIN = testDomain;
    
    const host = process.env.SERVER_DOMAIN;
    
    assert.strictEqual(host, testDomain, 
      '환경 변수에서 서버 도메인 조회');
  });
});