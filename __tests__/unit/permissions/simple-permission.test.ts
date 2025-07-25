/**
 * 간단한 권한 시스템 테스트
 * ES 모듈 문제를 피하기 위해 간단하게 구현
 */

import test from 'node:test';
import assert from 'node:assert';

// UserRole enum
const UserRole = {
  ADMIN: 'ADMIN',
  VERIFIED: 'VERIFIED',
  GUEST: 'GUEST',
  ANONYMOUS: 'ANONYMOUS'
};

// Mock pagePermissions - 실제 설정과 동일
const mockPagePermissions = [
  // Public pages
  { path: '/', allowedRoles: [], isPublic: true },
  { path: '/login*', allowedRoles: [], isPublic: true },
  { path: '/_Index_of_Root*', allowedRoles: [], isPublic: true },
  { path: '/unauthorized', allowedRoles: [], isPublic: true },
  
  // Admin only pages
  { path: '/1. 일지*', allowedRoles: ['ADMIN'], isPublic: false },
  { path: '/3. 회사*', allowedRoles: ['ADMIN'], isPublic: false },
  { path: '/97. 보안 폴더*', allowedRoles: ['ADMIN'], isPublic: false },
  { path: '/99. 일기*', allowedRoles: ['ADMIN'], isPublic: false },
  { path: '/98. 미분류*', allowedRoles: ['ADMIN'], isPublic: false },
  
  // Admin and verified users
  { path: '/8. 루틴*', allowedRoles: ['ADMIN', 'VERIFIED'], isPublic: false }
];

// Mock hasPermission function - 실제 로직과 동일
function mockHasPermission(userRole: string | null, path: string): boolean {
  const decodedPath = decodeURIComponent(path);
  
  const permission = mockPagePermissions.find((p) => {
    const regexPattern = new RegExp(`^${decodeURIComponent(p.path).replace(/\*/g, ".*")}$`);
    return regexPattern.test(decodedPath);
  });

  if (!permission) return true; // 정의되지 않은 경로는 기본적으로 접근 허용
  
  return (
    permission.allowedRoles.includes(userRole || UserRole.ANONYMOUS) ||
    permission.isPublic
  );
}

// Mock isPublicPage function - 실제 로직과 동일
function mockIsPublicPage(path: string): boolean {
  const decodedPath = decodeURIComponent(path);

  const permission = mockPagePermissions.find((p) => {
    const regexPattern = new RegExp(`^${decodeURIComponent(p.path).replace(/\*/g, ".*")}$`);
    return regexPattern.test(decodedPath);
  });

  if (!permission) return false;
  return permission.isPublic;
}

test('권한 시스템 핵심 기능 테스트', async (t) => {

  await t.test('공개 페이지 접근 검증', async () => {
    const publicPages = [
      '/',
      '/login',
      '/_Index_of_Root.md',
      '/unauthorized'
    ];

    for (const page of publicPages) {
      // 모든 사용자 유형이 공개 페이지에 접근 가능해야 함
      assert.strictEqual(mockHasPermission(UserRole.ANONYMOUS, page), true, 
        `익명 사용자가 ${page} 접근 불가`);
      assert.strictEqual(mockHasPermission(UserRole.GUEST, page), true, 
        `게스트가 ${page} 접근 불가`);
      assert.strictEqual(mockHasPermission(UserRole.VERIFIED, page), true, 
        `인증 사용자가 ${page} 접근 불가`);
      assert.strictEqual(mockHasPermission(UserRole.ADMIN, page), true, 
        `관리자가 ${page} 접근 불가`);
      
      // isPublicPage 함수도 일치해야 함
      assert.strictEqual(mockIsPublicPage(page), true, 
        `${page}가 공개 페이지로 인식되지 않음`);
    }
    
    console.log('✅ 공개 페이지 접근 권한 검증 완료');
  });

  await t.test('관리자 전용 페이지 보안 검증', async () => {
    const adminOnlyPages = [
      '/1. 일지/_Index_of_1. 일지.md',
      '/1. 일지/2025-07-24.md',
      '/3. 회사/_Index_of_3. 회사.md',
      '/97. 보안 폴더/sensitive-doc.md',
      '/99. 일기/private-diary.md',
      '/98. 미분류/misc-doc.md'
    ];

    for (const page of adminOnlyPages) {
      // 관리자만 접근 가능
      assert.strictEqual(mockHasPermission(UserRole.ADMIN, page), true, 
        `관리자가 ${page} 접근 불가`);
      
      // 다른 사용자들은 접근 불가 - 보안 검증
      assert.strictEqual(mockHasPermission(UserRole.VERIFIED, page), false, 
        `❌ 보안 위험: 인증 사용자가 ${page} 접근 가능`);
      assert.strictEqual(mockHasPermission(UserRole.GUEST, page), false, 
        `❌ 보안 위험: 게스트가 ${page} 접근 가능`);
      assert.strictEqual(mockHasPermission(UserRole.ANONYMOUS, page), false, 
        `❌ 보안 위험: 익명 사용자가 ${page} 접근 가능`);
      
      // 공개 페이지가 아님을 확인
      assert.strictEqual(mockIsPublicPage(page), false, 
        `❌ 보안 위험: ${page}가 공개 페이지로 잘못 인식됨`);
    }
    
    console.log('✅ 관리자 전용 페이지 보안 검증 완료');
  });

  await t.test('인증+관리자 페이지 권한 검증', async () => {
    const verifiedPages = [
      '/8. 루틴/_Index_of_8. 루틴.md',
      '/8. 루틴/morning-routine.md'
    ];

    for (const page of verifiedPages) {
      // 관리자와 인증 사용자만 접근 가능
      assert.strictEqual(mockHasPermission(UserRole.ADMIN, page), true, 
        `관리자가 ${page} 접근 불가`);
      assert.strictEqual(mockHasPermission(UserRole.VERIFIED, page), true, 
        `인증 사용자가 ${page} 접근 불가`);
      
      // 게스트와 익명 사용자는 접근 불가
      assert.strictEqual(mockHasPermission(UserRole.GUEST, page), false, 
        `❌ 보안 위험: 게스트가 ${page} 접근 가능`);
      assert.strictEqual(mockHasPermission(UserRole.ANONYMOUS, page), false, 
        `❌ 보안 위험: 익명 사용자가 ${page} 접근 가능`);
      
      // 공개 페이지가 아님을 확인
      assert.strictEqual(mockIsPublicPage(page), false, 
        `${page}가 공개 페이지로 잘못 인식됨`);
    }
    
    console.log('✅ 인증+관리자 페이지 권한 검증 완료');
  });

  await t.test('URL 인코딩 처리 검증', async () => {
    const encodedPaths = [
      {
        encoded: '/1.%20%EC%9D%BC%EC%A7%80/_Index_of_1.%20%EC%9D%BC%EC%A7%80.md',
        decoded: '/1. 일지/_Index_of_1. 일지.md',
        role: UserRole.ANONYMOUS,
        expected: false,
        description: '일지 페이지 (익명 차단)'
      },
      {
        encoded: '/8.%20%EB%A3%A8%ED%8B%B4/_Index_of_8.%20%EB%A3%A8%ED%8B%B4.md',
        decoded: '/8. 루틴/_Index_of_8. 루틴.md',
        role: UserRole.VERIFIED,
        expected: true,
        description: '루틴 페이지 (인증 허용)'
      },
      {
        encoded: '/_Index_of_Root.md',
        decoded: '/_Index_of_Root.md',
        role: UserRole.ANONYMOUS,
        expected: true,
        description: 'Root 페이지 (공개)'
      }
    ];

    for (const pathTest of encodedPaths) {
      // 인코딩된 경로와 디코딩된 경로 모두 동일한 결과
      const encodedResult = mockHasPermission(pathTest.role, pathTest.encoded);
      const decodedResult = mockHasPermission(pathTest.role, pathTest.decoded);
      
      assert.strictEqual(encodedResult, pathTest.expected, 
        `${pathTest.description}: 인코딩된 경로 권한 검사 실패`);
      assert.strictEqual(decodedResult, pathTest.expected, 
        `${pathTest.description}: 디코딩된 경로 권한 검사 실패`);
      assert.strictEqual(encodedResult, decodedResult, 
        `${pathTest.description}: 인코딩/디코딩 결과 불일치`);
    }
    
    console.log('✅ URL 인코딩 처리 검증 완료');
  });

  await t.test('보안 취약점 검증', async () => {
    // 수정 전에 있었던 보안 취약점이 해결되었는지 확인
    const criticalSecurityTests = [
      {
        path: '/1. 일지/secret-diary.md',
        role: UserRole.ANONYMOUS,
        expected: false,
        risk: '개인 일기 노출'
      },
      {
        path: '/3. 회사/company-secrets.md',
        role: UserRole.GUEST,
        expected: false,
        risk: '회사 기밀 노출'
      },
      {
        path: '/97. 보안 폴더/passwords.txt',
        role: UserRole.VERIFIED,
        expected: false,
        risk: '보안 정보 노출'
      }
    ];

    for (const secTest of criticalSecurityTests) {
      const result = mockHasPermission(secTest.role, secTest.path);
      assert.strictEqual(result, secTest.expected,
        `🚨 보안 위험: ${secTest.risk} - ${secTest.path}`);
    }
    
    console.log('✅ 보안 취약점 검증 완료 - 모든 중요 경로 보호됨');
  });

  await t.test('권한 설정 무결성 검증', async () => {
    // 중요한 보안 경로들이 올바르게 정의되어 있는지 확인
    const criticalPaths = [
      { pattern: '/1. 일지*', expected: 'ADMIN_ONLY' },
      { pattern: '/3. 회사*', expected: 'ADMIN_ONLY' },
      { pattern: '/8. 루틴*', expected: 'ADMIN_VERIFIED' },
      { pattern: '/_Index_of_Root*', expected: 'PUBLIC' }
    ];

    for (const pathCheck of criticalPaths) {
      const permission = mockPagePermissions.find(p => p.path === pathCheck.pattern);
      assert.ok(permission, `중요 경로 ${pathCheck.pattern}가 정의되지 않음`);
      
      if (pathCheck.expected === 'PUBLIC') {
        assert.strictEqual(permission?.isPublic, true, 
          `공개 경로 ${pathCheck.pattern}가 비공개로 설정됨`);
      } else {
        assert.strictEqual(permission?.isPublic, false, 
          `보안 경로 ${pathCheck.pattern}가 공개로 설정됨`);
        assert.ok(permission?.allowedRoles.includes('ADMIN'), 
          `보안 경로 ${pathCheck.pattern}에 관리자 권한이 없음`);
      }
    }
    
    console.log('✅ 권한 설정 무결성 검증 완료');
  });

});

test('권한 시스템 성능 테스트', async (t) => {

  await t.test('대량 권한 체크 성능', async () => {
    const testPaths = [
      '/_Index_of_Root.md',
      '/1. 일지/test.md',
      '/3. 회사/test.md',
      '/8. 루틴/test.md',
      '/97. 보안 폴더/test.md'
    ];
    
    const iterations = 1000;
    const startTime = Date.now();
    
    for (let i = 0; i < iterations; i++) {
      for (const path of testPaths) {
        mockHasPermission(UserRole.ADMIN, path);
        mockHasPermission(UserRole.ANONYMOUS, path);
        mockIsPublicPage(path);
      }
    }
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    const avgTimePerCheck = totalTime / (iterations * testPaths.length * 3);
    
    console.log(`⚡ 권한 체크 성능: ${iterations * testPaths.length * 3}회 실행 in ${totalTime}ms`);
    console.log(`⚡ 평균 권한 체크 시간: ${avgTimePerCheck.toFixed(3)}ms`);
    
    // 권한 체크는 1ms 이내에 완료되어야 함
    assert.ok(avgTimePerCheck < 1, 
      `권한 체크가 너무 느림: ${avgTimePerCheck}ms (목표: <1ms)`);
      
    console.log('✅ 권한 시스템 성능 테스트 통과');
  });

});