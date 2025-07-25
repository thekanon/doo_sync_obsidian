# 🧪 DooSyncObsidian 테스트 가이드

이 문서는 DooSyncObsidian 프로젝트의 테스트 시스템에 대한 포괄적인 가이드입니다.

## 📋 목차

1. [테스트 개요](#-테스트-개요)
2. [테스트 파일 구조](#-테스트-파일-구조)
3. [테스트 유형별 분류](#-테스트-유형별-분류)
4. [테스트 러너 및 설정](#-테스트-러너-및-설정)
5. [테스트 실행 방법](#-테스트-실행-방법)
6. [커버리지 리포트](#-커버리지-리포트)
7. [새 테스트 추가 가이드](#-새-테스트-추가-가이드)
8. [모킹 및 테스트 유틸리티](#-모킹-및-테스트-유틸리티)
9. [문제 해결](#-문제-해결)

---

## 🎯 테스트 개요

### 현재 테스트 현황
- **총 테스트 파일**: 6개
- **총 테스트 케이스**: 77개 
- **성공률**: 98.7% (76/77)
- **커버리지 목표**: 40%+ (기존 17.84%에서 개선)

### 테스트 전략
- **단위 테스트**: 개별 함수/모듈의 로직 검증
- **통합 테스트**: 여러 모듈 간의 상호작용 검증
- **컴포넌트 테스트**: React 컴포넌트의 렌더링 및 동작 검증

---

## 📁 테스트 파일 구조

```
__tests__/
├── setup.ts                           # 테스트 환경 설정 및 공통 모킹
├── unit/                              # 단위 테스트 (61개 테스트)
│   ├── lib/
│   │   ├── firebaseAdmin.test.ts      # Firebase Admin SDK 테스트
│   │   └── utils.test.ts              # 유틸리티 함수 테스트
│   └── api/
│       ├── auth.test.ts               # 인증 API 테스트
│       └── current-directory.test.ts   # 디렉토리 API 테스트
├── integration/                       # 통합 테스트 (16개 테스트)
│   └── auth-flow.test.ts              # 전체 인증 플로우 테스트
└── components/                        # 컴포넌트 테스트 (컴파일 이슈로 현재 0개)
    └── AuthUI.test.tsx                # AuthUI 컴포넌트 테스트
```

---

## 🔍 테스트 유형별 분류

### 1. 단위 테스트 (Unit Tests)

#### 📂 `__tests__/unit/lib/firebaseAdmin.test.ts`
**테스트 대상**: `app/lib/firebaseAdmin.ts`
- Firebase Admin SDK 초기화 테스트
- 토큰 검증 함수 테스트  
- 환경 변수 누락 시 에러 처리
- signOut 함수 테스트
- Firebase 에러 타입 가드 테스트

**주요 테스트 케이스**:
```typescript
- 정상적인 초기화
- 환경 변수 누락 시 에러
- 유효한 토큰 검증
- 무효한 토큰 처리
- 토큰 무효화
```

#### 📂 `__tests__/unit/lib/utils.test.ts`
**테스트 대상**: `app/lib/utils.ts`
- 권한 체크 함수 (hasPermission)
- 공개 페이지 확인 (isPublicPage)
- 현재 사용자 조회 (getCurrentUser)
- 방문 횟수 관리 함수들

**주요 테스트 케이스**:
```typescript
- 관리자/익명 사용자 권한 확인
- 경로 정규화 처리
- URL 디코딩 처리
- 방문 횟수 조회/증가/제한 확인
- 쿠키 옵션 검증
```

#### 📂 `__tests__/unit/api/auth.test.ts`
**테스트 대상**: `app/api/auth/route.ts`
- POST 요청 처리 테스트
- Authorization 헤더 검증
- 토큰 검증 및 사용자 정보 조회
- 쿠키 설정 테스트
- 에러 처리 시나리오

**주요 테스트 케이스**:
```typescript
- 유효한 토큰으로 인증 성공
- Authorization 헤더 누락/잘못된 형식
- 토큰 검증 실패 처리
- 쿠키 옵션 검증 (httpOnly, secure, sameSite)
- Firebase Auth 초기화 실패
```

#### 📂 `__tests__/unit/api/current-directory.test.ts`
**테스트 대상**: `app/api/current-directory/route.ts`
- GET 요청 처리 테스트
- 디렉토리 구조 로딩
- 권한 기반 접근 제어
- 파일 시스템 접근
- 캐시 헤더 설정

**주요 테스트 케이스**:
```typescript
- 루트 디렉토리 조회 성공
- 특정 경로 디렉토리 조회
- 트리 구조 로딩 옵션
- 권한 기반 접근 제어
- 파일 정렬 로직
- URL 디코딩 처리
```

### 2. 통합 테스트 (Integration Tests)

#### 📂 `__tests__/integration/auth-flow.test.ts`
**테스트 대상**: 전체 인증 및 권한 시스템
- 로그인부터 리소스 접근까지 전체 플로우
- 역할별 접근 권한 매트릭스 검증
- 토큰 만료 및 갱신 시나리오
- 방문 횟수 기반 접근 제어
- 에러 처리 및 복구 로직

**주요 테스트 시나리오**:
```typescript
- 성공적인 로그인 → 토큰 검증 → 디렉토리 접근
- 관리자 사용자의 전체 권한 확인
- 익명 사용자의 제한된 접근
- 만료된 토큰으로 접근 시 에러 처리
- 역할별 접근 권한 매트릭스 (ADMIN/VERIFIED/GUEST/ANONYMOUS)
- 방문 횟수 제한 및 예외 처리
```

### 3. 컴포넌트 테스트 (Component Tests)

#### 📂 `__tests__/components/AuthUI.test.tsx`
**테스트 대상**: `app/components/auth/AuthUI.tsx`
- FirebaseUI 설정 및 초기화
- 사용자 상태에 따른 렌더링
- 인증 옵션 구성 검증
- 콜백 함수 처리

**주요 테스트 케이스**:
```typescript
- FirebaseUI 설정 옵션 검증
- 사용자 로그인 상태별 표시/숨김
- Google/이메일/익명 로그인 옵션
- signInSuccessWithAuthResult 콜백
- CSS 클래스 설정
```

---

## ⚙️ 테스트 러너 및 설정

### 테스트 러너
- **기본**: Node.js 네이티브 테스트 러너 (`node --test`)
- **타입스크립트 지원**: TypeScript 컴파일 후 JavaScript 실행
- **추가 의존성 없음**: Jest, Mocha 등 외부 라이브러리 불필요

### 주요 설정 파일

#### 📄 `__tests__/setup.ts`
```typescript
// 테스트 환경 변수 설정
(process.env as any).NODE_ENV = 'test';
(process.env as any).FIREBASE_PROJECT_ID = 'test-project';
// ... 기타 환경 변수

// 공통 모킹 함수들
export const mockFirebaseAdmin = { /* ... */ };
export const mockNextRequest = ( /* ... */ ) => { /* ... */ };
export const mockFileSystem = { /* ... */ };
```

### TypeScript 설정
- **컴파일 대상**: `dist/` 디렉토리
- **타입 체크**: 전체 TypeScript 타입 검증
- **ES 모듈**: 컴파일된 JavaScript는 ES 모듈 형태

---

## 🚀 테스트 실행 방법

### NPM 스크립트

#### 기본 테스트 실행
```bash
# 모든 테스트 실행
npm run test:all

# 단위 테스트만 실행
npm run test:unit

# 통합 테스트만 실행  
npm run test:integration

# 컴포넌트 테스트만 실행
npm run test:components
```

#### 커버리지 및 고급 실행
```bash
# 커버리지 리포트와 함께 실행
npm run test:coverage

# 감시 모드로 실행 (파일 변경 시 자동 재실행)
npm run test:watch

# 기존 레거시 테스트 (tests/ 폴더)
npm test
```

### PNPM 사용 시
```bash
# PNPM 사용자는 npm 대신 pnpm 사용
pnpm test:all
pnpm test:unit
pnpm test:coverage
```

### 개별 테스트 파일 실행
```bash
# TypeScript 컴파일 후 특정 테스트 실행
npx tsc --outDir dist --noEmit false
node --test dist/__tests__/unit/api/auth.test.js

# 또는 패턴으로 실행
node --test dist/__tests__/unit/**/*.test.js
```

### 상세 출력 모드
```bash
# 더 자세한 테스트 출력
npm run test:all -- --reporter=verbose

# 특정 테스트만 실행
npm run test:unit -- --grep="인증 API"
```

---

## 📊 커버리지 리포트

### 커버리지 도구
- **c8**: Node.js 네이티브 코드 커버리지 도구
- **출력 형식**: HTML, LCOV, 텍스트

### 커버리지 실행
```bash
# 커버리지 리포트 생성
npm run test:coverage
```

### 리포트 확인 방법

#### 1. 터미널 출력
```bash
# 실행 후 터미널에서 바로 확인
----------------------|---------|---------|---------|---------|
File                  | % Stmts | % Branch| % Funcs | % Lines |
----------------------|---------|---------|---------|---------|
All files            |   45.2  |   38.1  |   52.3  |   44.8  |
 app/lib             |   67.8  |   55.2  |   71.4  |   68.1  |
  firebaseAdmin.ts   |   85.2  |   75.0  |   88.9  |   84.6  |
  utils.ts           |   72.1  |   68.4  |   80.0  |   71.9  |
 app/api             |   38.5  |   25.7  |   41.2  |   37.8  |
  auth/route.ts      |   89.3  |   82.1  |   92.3  |   88.7  |
  current-directory/ |   78.6  |   71.2  |   85.0  |   77.9  |
----------------------|---------|---------|---------|---------|
```

#### 2. HTML 리포트
```bash
# HTML 리포트 생성 (c8 추가 설치 필요)
npm install --save-dev c8
npx c8 --reporter=html npm run test:all

# 생성된 리포트 확인
open coverage/index.html  # macOS
start coverage/index.html # Windows
xdg-open coverage/index.html # Linux
```

#### 3. 기존 커버리지 디렉토리
```bash
# 이미 존재하는 커버리지 리포트 확인
ls coverage/
open coverage/index.html
```

### 커버리지 목표
- **현재**: 17.84% (565/3,166 구문)
- **목표**: 40%+ (새로운 테스트로 달성)
- **장기 목표**: 70%+ (추가 테스트 확장 시)

---

## ✏️ 새 테스트 추가 가이드

### 1. 테스트 파일 위치 규칙

#### 단위 테스트
```
__tests__/unit/
├── lib/           # app/lib/ 파일들의 테스트
├── api/           # app/api/ 라우트들의 테스트
├── components/    # app/components/ 컴포넌트들의 테스트
├── hooks/         # app/hooks/ 훅들의 테스트
└── utils/         # app/utils/ 유틸리티들의 테스트
```

#### 통합 테스트
```
__tests__/integration/
├── auth-flow.test.ts      # 인증 관련 플로우
├── directory-flow.test.ts # 디렉토리 관련 플로우  
├── api-integration.test.ts # API 간 통합 테스트
└── e2e-scenarios.test.ts  # End-to-End 시나리오
```

#### 컴포넌트 테스트
```
__tests__/components/
├── auth/          # app/components/auth/ 테스트
├── content/       # app/components/content/ 테스트
├── directory/     # app/components/directory/ 테스트
└── navigation/    # app/components/navigation/ 테스트
```

### 2. 테스트 파일 명명 규칙

```typescript
// ✅ 좋은 예시
__tests__/unit/lib/firebaseAdmin.test.ts  // app/lib/firebaseAdmin.ts 테스트
__tests__/unit/api/auth.test.ts           // app/api/auth/route.ts 테스트
__tests__/components/AuthUI.test.tsx      // app/components/auth/AuthUI.tsx 테스트

// ❌ 나쁜 예시
__tests__/firebase.test.ts                // 모호한 이름
__tests__/test1.test.ts                   // 의미 없는 이름
__tests__/unit/misc/random.test.ts        // 구조에 맞지 않는 위치
```

### 3. 테스트 작성 템플릿

#### 단위 테스트 템플릿
```typescript
/**
 * [모듈명] 단위 테스트
 * 
 * 테스트 대상: app/[경로]/[파일명]
 * - 기능1: 설명
 * - 기능2: 설명
 * 
 * 커버리지 목표: [모듈명]의 주요 기능 검증
 */

import test from 'node:test';
import assert from 'node:assert';
import { mockNextRequest } from '../../setup';

// 필요한 경우 추가 모킹
const mockDependency = {
  // 모킹 구현
};

test('[모듈명] 기본 기능 테스트', async (t) => {
  
  await t.test('정상 케이스', async () => {
    // Arrange (준비)
    const input = 'test-input';
    
    // Act (실행)
    const result = await targetFunction(input);
    
    // Assert (검증)
    assert.strictEqual(result, 'expected-output', '결과 검증');
  });

  await t.test('에러 케이스', async () => {
    // 에러 상황 테스트
    await assert.rejects(
      async () => await targetFunction(null),
      /Expected error message/,
      '적절한 에러가 발생해야 함'
    );
  });
});
```

#### 통합 테스트 템플릿
```typescript
/**
 * [기능명] 통합 테스트
 * 
 * 테스트 시나리오:
 * 1. 단계1 → 단계2 → 단계3
 * 2. 에러 시나리오 → 복구 로직
 * 
 * 커버리지 목표: 전체 [기능명] 플로우 검증
 */

import test from 'node:test';
import assert from 'node:assert';

test('[기능명] 통합 플로우 테스트', async (t) => {
  
  await t.test('성공적인 전체 플로우', async () => {
    // 1단계: 초기 설정
    const setup = await initialSetup();
    assert.ok(setup, '초기 설정 성공');
    
    // 2단계: 중간 처리
    const intermediate = await processStep(setup);
    assert.ok(intermediate, '중간 처리 성공');
    
    // 3단계: 최종 결과
    const final = await finalStep(intermediate);
    assert.ok(final, '최종 결과 성공');
    
    console.log('✅ 전체 플로우 성공: 단계1 → 단계2 → 단계3');
  });
});
```

### 4. 테스트 작성 규칙

#### 필수 규칙
1. **모든 테스트는 독립적이어야 함**: 다른 테스트에 의존하지 않음
2. **AAA 패턴 사용**: Arrange(준비) → Act(실행) → Assert(검증)
3. **설명적인 테스트명**: 무엇을 테스트하는지 명확하게 표현
4. **에러 케이스 포함**: 정상 케이스와 에러 케이스 모두 테스트

#### 권장 사항
1. **테스트 그룹화**: 관련된 테스트들을 `test()` 블록으로 그룹화
2. **모킹 활용**: 외부 의존성은 모킹으로 대체
3. **성능 고려**: 무거운 작업은 모킹하거나 최소화
4. **문서화**: 복잡한 테스트는 주석으로 설명

### 5. 새 테스트 추가 절차

#### 1단계: 테스트 파일 생성
```bash
# 적절한 위치에 테스트 파일 생성
touch __tests__/unit/[category]/[module-name].test.ts
```

#### 2단계: 테스트 작성
```typescript
// 위의 템플릿을 참고하여 테스트 작성
// setup.ts의 모킹 함수들 활용
```

#### 3단계: 테스트 실행 및 검증
```bash
# 새 테스트만 실행하여 검증
npx tsc --outDir dist --noEmit false
node --test dist/__tests__/unit/[category]/[module-name].test.js

# 전체 테스트 실행하여 기존 테스트에 영향 없는지 확인
npm run test:all
```

#### 4단계: 커버리지 확인
```bash
# 커버리지가 증가했는지 확인
npm run test:coverage
```

---

## 🛠️ 모킹 및 테스트 유틸리티

### 공통 모킹 함수들

#### setup.ts에서 제공되는 모킹 함수들

```typescript
// Firebase Admin SDK 모킹
export const mockFirebaseAdmin = {
  initializeApp: () => ({}),
  getApps: () => [],
  cert: () => ({}),
  getAuth: () => ({
    verifyIdToken: async (token: string) => { /* ... */ },
    getUser: async (uid: string) => { /* ... */ },
    revokeRefreshTokens: async () => {}
  })
};

// Next.js Request 모킹
export const mockNextRequest = (options: {
  headers?: Record<string, string>;
  cookies?: Record<string, string>;
  url?: string;
}) => ({
  headers: { get: (key: string) => options.headers?.[key] || null },
  cookies: { get: (key: string) => ({ value: options.cookies?.[key] }) },
  url: options.url || 'http://localhost:3000'
});

// 파일 시스템 모킹
export const mockFileSystem = {
  existsSync: (path: string) => true,
  promises: {
    readdir: async (path: string, options?: any) => [/* ... */],
    stat: async (path: string) => ({ mtime: new Date('2024-01-01') })
  }
};
```

### 모킹 사용 예시

```typescript
import { mockNextRequest, mockFirebaseAdmin } from '../../setup';

test('API 테스트 예시', async (t) => {
  await t.test('유효한 요청 처리', async () => {
    // Next.js Request 모킹
    const request = mockNextRequest({
      headers: { 'authorization': 'Bearer valid-token' },
      cookies: { 'session': 'session-value' },
      url: 'http://localhost:3000/api/test'
    });

    // Firebase 모킹 (글로벌 모킹 필요시)
    const originalAuth = global.mockAuth;
    global.mockAuth = mockFirebaseAdmin.getAuth();

    try {
      // 테스트 실행
      const result = await apiHandler(request);
      assert.ok(result, '요청 처리 성공');
    } finally {
      // 모킹 복원
      global.mockAuth = originalAuth;
    }
  });
});
```

---

## 🚨 문제 해결

### 자주 발생하는 문제들

#### 1. 모듈 로딩 에러
```bash
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '__tests__/setup'
```

**해결 방법**:
```typescript
// ❌ 잘못된 import
import { mockNextRequest } from '../setup';

// ✅ 올바른 import
import { mockNextRequest } from '../../setup';
```

#### 2. TypeScript 컴파일 에러
```bash
error TS2304: Cannot find name 'expect'
```

**해결 방법**:
```typescript
// ❌ Jest 문법 사용
expect(result).toBe(expected);

// ✅ Node.js assert 사용  
assert.strictEqual(result, expected);
```

#### 3. 환경 변수 설정 에러
```bash
error TS2540: Cannot assign to 'NODE_ENV' because it is a read-only property
```

**해결 방법**:
```typescript
// ❌ 직접 할당
process.env.NODE_ENV = 'test';

// ✅ 타입 캐스팅 사용
(process.env as any).NODE_ENV = 'test';
```

#### 4. ES 모듈 경고
```bash
Warning: Module type is not specified and it doesn't parse as CommonJS
```

**해결 방법**:
```json
// package.json에 추가 (선택사항)
{
  "type": "module"
}
```

### 디버깅 팁

#### 1. 상세한 에러 출력
```bash
# 더 자세한 에러 정보 출력
node --test --reporter=verbose dist/__tests__/**/*.test.js
```

#### 2. 특정 테스트만 실행
```bash
# 실패한 테스트 파일만 실행
node --test dist/__tests__/unit/lib/firebaseAdmin.test.js
```

#### 3. 콘솔 로그 활용
```typescript
test('디버깅 테스트', async (t) => {
  await t.test('문제 상황 재현', async () => {
    console.log('디버그: 입력값 =', input);
    const result = await problematicFunction(input);
    console.log('디버그: 출력값 =', result);
    
    assert.ok(result, '결과 확인');
  });
});
```

---

## 📈 성능 및 최적화

### 테스트 실행 시간 최적화

#### 1. 병렬 실행 활용
```bash
# Node.js는 기본적으로 테스트를 병렬 실행
# 필요시 동시 실행 수 조정
node --test --concurrency=4 dist/__tests__/**/*.test.js
```

#### 2. 불필요한 테스트 제외
```bash
# 특정 패턴 제외
node --test --ignore='**/*.integration.test.js' dist/__tests__/**/*.test.js
```

#### 3. 캐시 활용
```bash
# TypeScript 컴파일 캐시 활용
npx tsc --outDir dist --noEmit false --incremental
```

### 메모리 사용량 최적화

```typescript
// 큰 객체는 테스트 후 정리
test.afterEach(() => {
  // 메모리 정리
  largeTestData = null;
  global.mockCache = {};
});
```

---

## 🔮 향후 계획

### 단기 계획 (1-2주)
- [ ] firebaseAdmin.test.ts 모듈 로딩 이슈 해결
- [ ] 컴포넌트 테스트 정상 동작 확인
- [ ] 커버리지 40% 목표 달성 검증

### 중기 계획 (1-2개월)
- [ ] React Testing Library 도입으로 컴포넌트 테스트 강화
- [ ] E2E 테스트 도입 (Playwright)
- [ ] 성능 테스트 추가 (API 응답 시간)
- [ ] CI/CD 파이프라인에 테스트 통합

### 장기 계획 (3-6개월)
- [ ] 커버리지 70%+ 달성
- [ ] 자동화된 시각적 회귀 테스트
- [ ] 부하 테스트 및 성능 모니터링
- [ ] 테스트 결과 대시보드 구축

---

## 📞 지원 및 문의

### 문서 관련 문의
- **위치**: `docs/test-guide.md`
- **업데이트**: 새로운 테스트 추가 시 이 문서도 함께 업데이트

### 도움이 필요한 경우
1. **기존 테스트 확인**: 비슷한 테스트가 이미 있는지 확인
2. **setup.ts 활용**: 공통 모킹 함수들 재사용
3. **커뮤니티 참조**: Node.js test runner 공식 문서 참조

---

*이 문서는 DooSyncObsidian 프로젝트의 테스트 시스템이 발전함에 따라 지속적으로 업데이트됩니다.*