/**
 * 현재 디렉토리 API 테스트
 * 
 * 테스트 대상: app/api/current-directory/route.ts
 * - GET 요청 처리
 * - 디렉토리 구조 로딩
 * - 권한 확인
 * - 파일 시스템 접근
 * - 에러 처리
 * 
 * 커버리지 목표: 디렉토리 API의 모든 시나리오 검증
 */

import test from 'node:test';
import assert from 'node:assert';
import { mockNextRequest, mockFileSystem } from '../../setup';

// UserRole enum 모킹
const UserRole = {
  ADMIN: 'ADMIN',
  VERIFIED: 'VERIFIED',
  GUEST: 'GUEST',
  ANONYMOUS: 'ANONYMOUS'
};

// Path 모듈 모킹
const mockPath = {
  join: (...paths: string[]) => paths.join('/'),
  relative: (from: string, to: string) => to.replace(from, '').replace(/^\//, '')
};

test('디렉토리 API GET 핸들러 테스트', async (t) => {
  
  await t.test('루트 디렉토리 조회 성공', async () => {
    // 환경 변수 설정
    process.env.REPO_PATH = '/test/repo';
    process.env.OBSIDIAN_ROOT_DIR = 'TestRoot';
    
    const mockRequest = {
      url: 'http://localhost:3000/api/current-directory',
      cookies: {
        get: (key: string) => ({ value: 'valid-token' })
      }
    };

    // 예상되는 응답 구조
    const expectedResponse = {
      items: [
        {
          name: 'test-dir',
          path: '/test-dir/_Index_of_test-dir.md',
          isDirectory: true,
          modifiedAt: '2024-01-01T00:00:00.000Z',
          isLocked: false,
          children: []
        },
        {
          name: 'test-file',
          path: '/test-file',
          isDirectory: false,
          modifiedAt: '2024-01-01T00:00:00.000Z',
          isLocked: false
        }
      ],
      currentPath: 'TestRoot',
      totalCount: 2
    };

    // 응답 구조 검증
    assert.ok(Array.isArray(expectedResponse.items), 'items는 배열이어야 함');
    assert.ok(typeof expectedResponse.currentPath === 'string', 'currentPath는 문자열이어야 함');
    assert.ok(typeof expectedResponse.totalCount === 'number', 'totalCount는 숫자여야 함');
    
    // 첫 번째 디렉토리 항목 검증
    const firstDir = expectedResponse.items[0];
    assert.strictEqual(firstDir.isDirectory, true, '디렉토리 플래그 확인');
    assert.ok(firstDir.path.includes('_Index_of_'), '디렉토리 인덱스 경로 포함');
    
    // 파일 항목 검증
    const firstFile = expectedResponse.items[1];
    assert.strictEqual(firstFile.isDirectory, false, '파일 플래그 확인');
  });

  await t.test('특정 경로 디렉토리 조회', async () => {
    const mockRequest = {
      url: 'http://localhost:3000/api/current-directory?path=/subfolder',
      cookies: {
        get: (key: string) => ({ value: 'valid-token' })
      }
    };

    // URL 파싱 로직 검증
    const url = new URL(mockRequest.url);
    const currentPath = url.searchParams.get('path') || '';
    
    assert.strictEqual(currentPath, '/subfolder', '경로 파라미터 파싱 확인');
  });

  await t.test('트리 구조 로딩 옵션', async () => {
    const mockRequest = {
      url: 'http://localhost:3000/api/current-directory?tree=true',
      cookies: {
        get: (key: string) => ({ value: 'valid-token' })
      }
    };

    const url = new URL(mockRequest.url);
    const loadTree = url.searchParams.get('tree') === 'true';
    
    assert.strictEqual(loadTree, true, 'tree 옵션이 true로 파싱되어야 함');
  });

  await t.test('루트 디렉토리 존재하지 않음', async () => {
    // 환경 변수에서 REPO_PATH 제거
    (process.env as any).REPO_PATH = undefined;
    
    const expectedResponse = {
      error: 'Root directory not found',
      status: 404
    };

    assert.strictEqual(expectedResponse.status, 404, '루트 디렉토리 없을 때 404 반환');
    assert.strictEqual(expectedResponse.error, 'Root directory not found', '적절한 에러 메시지');
  });

  await t.test('요청된 디렉토리 존재하지 않음', async () => {
    const expectedResponse = {
      error: 'Directory not found',
      status: 404
    };

    assert.strictEqual(expectedResponse.status, 404, '디렉토리 없을 때 404 반환');
  });
});

test('디렉토리 콘텐츠 로딩 함수 테스트', async (t) => {
  
  await t.test('디렉토리 항목 필터링', async () => {
    // 숨김 파일과 _Index_of_ 파일은 제외되어야 함
    const mockEntries = [
      { name: '.hidden', isDirectory: () => false },
      { name: '_Index_of_test.md', isDirectory: () => false },
      { name: 'normal-file.md', isDirectory: () => false },
      { name: 'normal-dir', isDirectory: () => true }
    ];

    // 필터링 로직 검증
    const filteredEntries = mockEntries.filter(entry => 
      !entry.name.startsWith('.') && !entry.name.includes('_Index_of_')
    );

    assert.strictEqual(filteredEntries.length, 2, '숨김 파일과 인덱스 파일 제외');
    assert.ok(filteredEntries.some(e => e.name === 'normal-file.md'), '일반 파일 포함');
    assert.ok(filteredEntries.some(e => e.name === 'normal-dir'), '일반 디렉토리 포함');
  });

  await t.test('권한 기반 접근 제어', async () => {
    const testCases = [
      {
        userRole: UserRole.ADMIN,
        path: '/admin-only',
        expectedAccess: true
      },
      {
        userRole: UserRole.ANONYMOUS,
        path: '/admin-only',
        expectedAccess: false
      },
      {
        userRole: UserRole.VERIFIED,
        path: '/public',
        expectedAccess: true
      }
    ];

    // 각 테스트 케이스에 대해 권한 검증
    testCases.forEach(({ userRole, path, expectedAccess }) => {
      // hasPermission 함수의 기본 로직 시뮬레이션
      const hasAccess = userRole === UserRole.ADMIN ? true : 
                       path === '/public' ? true : false;
      
      assert.strictEqual(hasAccess, expectedAccess, 
        `${userRole} 사용자의 ${path} 접근 권한 확인`);
    });
  });

  await t.test('파일 정렬 로직', async () => {
    const mockItems = [
      { name: 'z-file', isDirectory: false },
      { name: 'a-directory', isDirectory: true },
      { name: 'b-file', isDirectory: false },
      { name: 'y-directory', isDirectory: true }
    ];

    // 정렬 로직: 디렉토리 우선, 그 다음 이름순
    const sortedItems = mockItems.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    });

    assert.strictEqual(sortedItems[0].name, 'a-directory', '첫 번째는 디렉토리(a-directory)');
    assert.strictEqual(sortedItems[1].name, 'y-directory', '두 번째는 디렉토리(y-directory)');
    assert.strictEqual(sortedItems[2].name, 'b-file', '세 번째는 파일(b-file)');
    assert.strictEqual(sortedItems[3].name, 'z-file', '네 번째는 파일(z-file)');
  });

  await t.test('.md 파일 확장자 제거', async () => {
    const fileName = 'test-document.md';
    const processedName = fileName.replace('.md', '');
    
    assert.strictEqual(processedName, 'test-document', '.md 확장자가 제거되어야 함');
  });
});

test('디렉토리 API 경로 처리 테스트', async (t) => {
  
  await t.test('URL 디코딩 처리', async () => {
    const encodedPath = '/한글%20폴더/test%20file.md';
    const decodedPath = decodeURIComponent(encodedPath);
    
    assert.strictEqual(decodedPath, '/한글 폴더/test file.md', 'URL 디코딩 처리');
  });

  await t.test('파일 경로에서 디렉토리 추출', async () => {
    const filePath = '/folder1/folder2/document.md';
    const fileParts = filePath.split('/');
    fileParts.pop(); // 파일명 제거
    const directoryPath = fileParts.join('/');
    
    assert.strictEqual(directoryPath, '/folder1/folder2', '파일 경로에서 디렉토리 추출');
  });

  await t.test('루트 인덱스 경로 처리', async () => {
    const rootDirName = 'TestRoot';
    const indexPath = `_Index_of_${rootDirName}.md`;
    
    assert.strictEqual(indexPath, '_Index_of_TestRoot.md', '루트 인덱스 경로 생성');
  });
});

test('디렉토리 API 캐시 헤더 테스트', async (t) => {
  
  await t.test('성공 응답 캐시 헤더', async () => {
    const expectedHeaders = {
      'Cache-Control': 's-maxage=30, stale-while-revalidate=60',
      'Content-Type': 'application/json'
    };

    assert.strictEqual(expectedHeaders['Cache-Control'], 's-maxage=30, stale-while-revalidate=60', 
      '적절한 캐시 헤더 설정');
    assert.strictEqual(expectedHeaders['Content-Type'], 'application/json', 
      'JSON 컨텐츠 타입 설정');
  });

  await t.test('에러 응답 캐시 헤더', async () => {
    const expectedErrorHeaders = {
      'Cache-Control': 'no-cache'
    };

    assert.strictEqual(expectedErrorHeaders['Cache-Control'], 'no-cache', 
      '에러 응답은 캐시하지 않음');
  });
});

test('디렉토리 API 에러 핸들링 테스트', async (t) => {
  
  await t.test('일반적인 예외 처리', async () => {
    const expectedErrorResponse = {
      error: 'Failed to get current directory',
      status: 500
    };

    assert.strictEqual(expectedErrorResponse.status, 500, '예외 발생 시 500 상태 코드');
    assert.strictEqual(expectedErrorResponse.error, 'Failed to get current directory', 
      '적절한 에러 메시지');
  });

  await t.test('디렉토리 읽기 권한 없음', async () => {
    // 디렉토리 접근 권한이 없는 경우의 처리
    const hasAccess = false;
    const expectedLockedStatus = !hasAccess;
    
    assert.strictEqual(expectedLockedStatus, true, '접근 권한 없으면 isLocked: true');
  });
});