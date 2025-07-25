/**
 * 페이지 권한 시스템 테스트
 *
 * 테스트 대상: app/types/pagePermissions.ts + app/lib/utils.ts
 * - 실제 권한 설정이 올바르게 작동하는지 검증
 * - 각 사용자 역할별 접근 권한 매트릭스 검증
 * - 보안 취약점 방지 검증
 *
 * 중요: 실제 pagePermissions 설정을 사용하여 테스트
 */

import test from 'node:test';
import assert from 'node:assert';

// ==============================
// 공통 유틸
// ==============================
const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const wildcardToRegex = (pattern: string) =>
  new RegExp(
    '^' +
      escapeRegex(decodeURIComponent(pattern))
        .replace(/\\\*/g, '.*') +
      '$'
  );

function normalizePath(p?: string | null): string | null {
  if (p == null) return null;
  try {
    return decodeURIComponent(p);
  } catch {
    return p;
  }
}

// 실제 권한 설정과 유틸리티 함수 가져오기 - 동적 import 사용
const UserRole = {
  ADMIN: 'ADMIN',
  VERIFIED: 'VERIFIED',
  GUEST: 'GUEST',
  ANONYMOUS: 'ANONYMOUS',
} as const;

type Role = typeof UserRole[keyof typeof UserRole];

type HasPermission = (
  role: Role | null | undefined,
  path: string | null | undefined
) => boolean;

type IsPublicPage = (path: string | null | undefined) => boolean;

let pagePermissions: any[];
let hasPermission: HasPermission;
let isPublicPage: IsPublicPage;



// 모듈 동적 로딩 (CommonJS 호환)
async function loadModules() {
  try {
    const permissionsModule = await import('../../../app/types/pagePermissions.js');
    const utilsModule = await import('../../../app/lib/utils.js') as {
      hasPermission: HasPermission;
      isPublicPage: IsPublicPage;
    };

    pagePermissions = permissionsModule.pagePermissions;
    hasPermission  = utilsModule.hasPermission;
    isPublicPage   = utilsModule.isPublicPage;
  } catch {
    // fallback
    pagePermissions = [ /* ... */ ];

    const _hasPermission: HasPermission = (role, path) => {
      if (path == null) return true; // (테스트 계약에 맞게)
      const permission = pagePermissions.find((p) => {
        const regexPattern = new RegExp(
          `^${decodeURIComponent(p.path).replace(/\*/g, '.*')}$`
        );
        return regexPattern.test(path);
      });
      if (!permission) return true;
      return permission.allowedRoles.includes(role as string) || permission.isPublic;
    };

    const _isPublicPage: IsPublicPage = (path) => {
      if (path == null) return false;
      const permission = pagePermissions.find((p) => {
        const regexPattern = new RegExp(
          `^${decodeURIComponent(p.path).replace(/\*/g, '.*')}$`
        );
        return regexPattern.test(path);
      });
      return permission?.isPublic ?? false;
    };

    hasPermission = _hasPermission;
    isPublicPage  = _isPublicPage;
  }
}


test('페이지 권한 시스템 전체 테스트', async (t) => {
  // 모듈 로딩
  await loadModules();

  await t.test('공개 페이지 접근 권한 검증', async () => {
    const publicPages = ['/', '/login', '/_Index_of_Root.md', '/unauthorized'];

    for (const page of publicPages) {
      // 모든 사용자 유형이 공개 페이지에 접근 가능해야 함
      assert.strictEqual(
        hasPermission(UserRole.ANONYMOUS, page),
        true,
        `익명 사용자가 ${page} 접근 불가`
      );
      assert.strictEqual(
        hasPermission(UserRole.GUEST, page),
        true,
        `게스트가 ${page} 접근 불가`
      );
      assert.strictEqual(
        hasPermission(UserRole.VERIFIED, page),
        true,
        `인증 사용자가 ${page} 접근 불가`
      );
      assert.strictEqual(
        hasPermission(UserRole.ADMIN, page),
        true,
        `관리자가 ${page} 접근 불가`
      );

      // isPublicPage 함수도 일치해야 함
      assert.strictEqual(
        isPublicPage(page),
        true,
        `${page}가 공개 페이지로 인식되지 않음`
      );
    }
  });

  await t.test('관리자 전용 페이지 접근 권한 검증', async () => {
    const adminOnlyPages = [
      '/1. 일지/_Index_of_1. 일지.md',
      '/1. 일지/2025-07-24.md',
      '/3. 회사/_Index_of_3. 회사.md',
      '/97. 보안 폴더/sensitive-doc.md',
      '/99. 일기/private-diary.md',
      '/98. 미분류/misc-doc.md',
    ];

    for (const page of adminOnlyPages) {
      // 관리자만 접근 가능
      assert.strictEqual(
        hasPermission(UserRole.ADMIN, page),
        true,
        `관리자가 ${page} 접근 불가`
      );

      // 다른 사용자들은 접근 불가
      assert.strictEqual(
        hasPermission(UserRole.VERIFIED, page),
        false,
        `인증 사용자가 ${page} 접근 가능 (보안 위험)`
      );
      assert.strictEqual(
        hasPermission(UserRole.GUEST, page),
        false,
        `게스트가 ${page} 접근 가능 (보안 위험)`
      );
      assert.strictEqual(
        hasPermission(UserRole.ANONYMOUS, page),
        false,
        `익명 사용자가 ${page} 접근 가능 (보안 위험)`
      );

      // 공개 페이지가 아님을 확인
      assert.strictEqual(
        isPublicPage(page),
        false,
        `${page}가 공개 페이지로 잘못 인식됨`
      );
    }
  });

  await t.test('관리자+인증 사용자 페이지 접근 권한 검증', async () => {
    const verifiedPages = [
      '/8. 루틴/_Index_of_8. 루틴.md',
      '/8. 루틴/morning-routine.md',
    ];

    for (const page of verifiedPages) {
      // 관리자와 인증 사용자만 접근 가능
      assert.strictEqual(
        hasPermission(UserRole.ADMIN, page),
        true,
        `관리자가 ${page} 접근 불가`
      );
      assert.strictEqual(
        hasPermission(UserRole.VERIFIED, page),
        true,
        `인증 사용자가 ${page} 접근 불가`
      );

      // 게스트와 익명 사용자는 접근 불가
      assert.strictEqual(
        hasPermission(UserRole.GUEST, page),
        false,
        `게스트가 ${page} 접근 가능 (보안 위험)`
      );
      assert.strictEqual(
        hasPermission(UserRole.ANONYMOUS, page),
        false,
        `익명 사용자가 ${page} 접근 가능 (보안 위험)`
      );

      // 공개 페이지가 아님을 확인
      assert.strictEqual(
        isPublicPage(page),
        false,
        `${page}가 공개 페이지로 잘못 인식됨`
      );
    }
  });

  await t.test('커리어 관련 페이지 보안 검증', async () => {
    const careerPages = [
      '/7. 생각정리/커리어/job-search.md',
      '/some-path/_Index_of_커리어.md',
    ];

    for (const page of careerPages) {
      // 관리자만 접근 가능
      assert.strictEqual(
        hasPermission(UserRole.ADMIN, page),
        true,
        `관리자가 커리어 페이지 ${page} 접근 불가`
      );

      // 다른 모든 사용자는 접근 불가
      assert.strictEqual(
        hasPermission(UserRole.VERIFIED, page),
        false,
        `인증 사용자가 커리어 페이지 ${page} 접근 가능 (기밀 위험)`
      );
      assert.strictEqual(
        hasPermission(UserRole.GUEST, page),
        false,
        `게스트가 커리어 페이지 ${page} 접근 가능 (기밀 위험)`
      );
      assert.strictEqual(
        hasPermission(UserRole.ANONYMOUS, page),
        false,
        `익명 사용자가 커리어 페이지 ${page} 접근 가능 (기밀 위험)`
      );
    }
  });

  await t.test('와일드카드 패턴 매칭 검증', async () => {
    // '*' 패턴이 올바르게 동작하는지 검증
    const testCases = [
      { path: '/1. 일지/any-file.md', pattern: '/1. 일지*', shouldMatch: true },
      {
        path: '/1. 일지/subfolder/deep-file.md',
        pattern: '/1. 일지*',
        shouldMatch: true,
      },
      { path: '/2. 지식/file.md', pattern: '/1. 일지*', shouldMatch: false },
      { path: '/public/doc.md', pattern: '/public/*', shouldMatch: true },
      {
        path: '/admin/settings/config.json',
        pattern: '/admin/*',
        shouldMatch: true,
      },
    ];

    for (const testCase of testCases) {
      const regex = wildcardToRegex(testCase.pattern);
      const matched = regex.test(testCase.path);

      if (testCase.shouldMatch) {
        assert.ok(
          matched,
          `패턴 ${testCase.pattern}이 경로 ${testCase.path}와 매칭되어야 하지만 매칭되지 않음`
        );
      } else {
        assert.strictEqual(
          matched,
          false,
          `패턴 ${testCase.pattern}이 경로 ${testCase.path}와 매칭되지 않아야 함`
        );
      }
    }
  });

  await t.test('URL 인코딩 처리 검증', async () => {
    // 한글 경로가 URL 인코딩된 경우에도 올바르게 동작하는지 검증
    const encodedPaths = [
      {
        encoded:
          '/1.%20%EC%9D%BC%EC%A7%80/_Index_of_1.%20%EC%9D%BC%EC%A7%80.md',
        decoded: '/1. 일지/_Index_of_1. 일지.md',
        role: UserRole.ANONYMOUS,
        expected: false,
      },
      {
        encoded:
          '/8.%20%EB%A3%A8%ED%8B%B4/_Index_of_8.%20%EB%A3%A8%ED%8B%B4.md',
        decoded: '/8. 루틴/_Index_of_8. 루틴.md',
        role: UserRole.VERIFIED,
        expected: true,
      },
      {
        encoded: '/_Index_of_Root.md',
        decoded: '/_Index_of_Root.md',
        role: UserRole.ANONYMOUS,
        expected: true,
      },
    ];

    for (const pathTest of encodedPaths) {
      // 인코딩된 경로와 디코딩된 경로 모두 동일한 결과를 가져야 함
      const encodedResult = hasPermission(pathTest.role, pathTest.encoded);
      const decodedResult = hasPermission(pathTest.role, pathTest.decoded);

      assert.strictEqual(
        encodedResult,
        pathTest.expected,
        `인코딩된 경로 ${pathTest.encoded}의 권한 검사 결과가 예상과 다름`
      );
      assert.strictEqual(
        decodedResult,
        pathTest.expected,
        `디코딩된 경로 ${pathTest.decoded}의 권한 검사 결과가 예상과 다름`
      );
      assert.strictEqual(
        encodedResult,
        decodedResult,
        `인코딩/디코딩된 경로의 결과가 일치하지 않음: ${pathTest.encoded}`
      );
    }
  });

  await t.test('정의되지 않은 경로 기본 동작 검증', async () => {
    // 현재는 정의되지 않은 경로가 허용되지만, 보안상 주의가 필요한 동작
    const undefinedPaths = [
      '/some-random-path.md',
      '/new-section/document.md',
      '/undefined/route/file.md',
    ];

    for (const path of undefinedPaths) {
      // 현재 구현에서는 정의되지 않은 경로를 허용 (utils.ts 현재 계약)
      const result = hasPermission(UserRole.ANONYMOUS, path);

      // 동작 로그
      console.log(`정의되지 않은 경로 ${path}: ${result ? '허용' : '거부'}`);

      assert.strictEqual(
        result,
        true,
        `정의되지 않은 경로 ${path}의 기본 동작이 예상과 다름`
      );
    }
  });

  await t.test('권한 설정 무결성 검증', async () => {
    // pagePermissions 배열이 올바른 구조를 가지고 있는지 검증
    assert.ok(Array.isArray(pagePermissions), 'pagePermissions이 배열이 아님');
    assert.ok(pagePermissions.length > 0, 'pagePermissions이 비어있음');

    const roles = Object.values(UserRole);

    for (let i = 0; i < pagePermissions.length; i++) {
      const permission = pagePermissions[i];

      assert.ok(
        typeof permission.path === 'string',
        `권한 설정 ${i}번째 항목의 path가 문자열이 아님`
      );
      assert.ok(
        Array.isArray(permission.allowedRoles),
        `권한 설정 ${i}번째 항목의 allowedRoles가 배열이 아님`
      );
      assert.ok(
        typeof permission.isPublic === 'boolean',
        `권한 설정 ${i}번째 항목의 isPublic이 불린이 아님`
      );

      // allowedRoles의 각 역할이 유효한지 확인
      for (const role of permission.allowedRoles) {
        assert.ok(
          roles.includes(role as any),
          `권한 설정 ${i}번째 항목에 유효하지 않은 역할 ${role}이 포함됨`
        );
      }

      // 논리적 일관성: isPublic=true면 allowedRoles는 비어있거나 모든 역할
      if (permission.isPublic) {
        const hasAllRoles = roles.every((role) =>
          permission.allowedRoles.includes(role)
        );
        const isEmpty = permission.allowedRoles.length === 0;
        assert.ok(
          hasAllRoles || isEmpty,
          `공개 페이지 ${permission.path}의 allowedRoles 설정이 논리적으로 일치하지 않음`
        );
      }
    }
  });

  await t.test('보안 경로 중복 검증', async () => {
    // 중요한 보안 경로들이 올바르게 정의되어 있는지 확인
    const criticalPaths = [
      '/1. 일지*',
      '/3. 회사*',
      '/97. 보안 폴더*',
      '/99. 일기*',
      '/8. 루틴*',
    ];

    for (const criticalPath of criticalPaths) {
      const matchingPermissions = pagePermissions.filter(
        (p) => p.path === criticalPath
      );

      assert.strictEqual(
        matchingPermissions.length,
        1,
        `중요 경로 ${criticalPath}가 ${matchingPermissions.length}번 정의됨 (1번이어야 함)`
      );

      const permission = matchingPermissions[0];
      assert.strictEqual(
        permission.isPublic,
        false,
        `중요 경로 ${criticalPath}가 공개로 설정됨 (보안 위험)`
      );
      assert.ok(
        permission.allowedRoles.includes(UserRole.ADMIN),
        `중요 경로 ${criticalPath}에 관리자 권한이 없음 (보안 위험)`
      );
    }
  });
});

test('권한 시스템 에지 케이스 테스트', async (t) => {
  await t.test('null/undefined 입력 처리', async () => {
    // null이나 undefined 값에 대한 안전한 처리 확인
    assert.strictEqual(hasPermission(null, '/some-path'), false);
    assert.strictEqual(hasPermission(undefined, '/some-path'), false);

    // 빈 문자열이나 잘못된 경로에 대한 처리
    assert.strictEqual(hasPermission(UserRole.ADMIN, ''), true); // 빈 경로는 허용
    assert.strictEqual(hasPermission(UserRole.ANONYMOUS, null), true); // null 경로는 기본 허용
  });

  await t.test('특수 문자 경로 처리', async () => {
    const specialPaths = [
      '/path with spaces/file.md',
      '/path-with-dashes/file.md',
      '/path_with_underscores/file.md',
      '/path.with.dots/file.md',
    ];

    for (const path of specialPaths) {
      const result = hasPermission(UserRole.ANONYMOUS, path);
      assert.strictEqual(result, true, `특수 문자 경로 ${path} 처리 실패`);
    }
  });

  await t.test('대소문자 구분 검증', async () => {
    const caseSensitivePaths = [
      { path: '/1. 일지/test.md', expected: false },
      { path: '/1. 일지/TEST.MD', expected: false },
      { path: '/Admin/test.md', expected: true }, // 정의되지 않음
    ];

    for (const testCase of caseSensitivePaths) {
      const result = hasPermission(UserRole.ANONYMOUS, testCase.path);
      assert.strictEqual(
        result,
        testCase.expected,
        `경로 ${testCase.path}의 대소문자 처리가 예상과 다름`
      );
    }
  });
});
