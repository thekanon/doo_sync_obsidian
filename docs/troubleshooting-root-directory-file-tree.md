# 문제 해결 문서: 루트 디렉토리에서 파일 트리가 렌더링되지 않는 문제

## 🔍 문제 상황

### 증상
- `http://localhost:33000/_Index_of_Root.md` 접속 시 왼쪽 사이드바에 "📂 No files in current directory" 메시지 표시
- `http://localhost:33000/5.%20프로젝트/_Index_of_5.%20프로젝트.md` 등 서브디렉토리에서는 정상 작동
- 서버 로그에는 파일 목록이 정상적으로 출력되지만 클라이언트에서는 렌더링되지 않음

### 초기 분석
- API가 정상적으로 데이터를 반환하고 있음 (curl 테스트로 확인)
- 특정 경로(루트)에서만 발생하는 문제
- 서버 사이드에서는 정상, 클라이언트 사이드에서만 문제

## 🔎 디버깅 과정

### 1단계: API 호출 확인
```bash
# API 응답 테스트
curl -s "http://localhost:33000/api/current-directory?path=%2F_Index_of_Root.md&tree=true"
```
**결과**: API가 정상적으로 13개의 디렉토리 항목을 반환

### 2단계: 프론트엔드 실행 여부 확인
`useCurrentDirectory` 훅에 디버그 로그 추가:
```typescript
console.log('useCurrentDirectory - pathname:', pathname);
console.log('useCurrentDirectory - currentDirectory:', currentDirectory);
```
**결과**: 클라이언트에서 로그가 전혀 출력되지 않음

### 3단계: 컴포넌트 마운트 확인
`CurrentDirectory` 컴포넌트에 디버그 로그 추가:
```typescript
function CurrentDirectoryComponent() {
  console.log('CurrentDirectory component mounted!');
  // ...
}
```
**결과**: 컴포넌트 마운트 로그도 출력되지 않음

### 4단계: 레이아웃 확인
`ClientLayout` 컴포넌트에 디버그 로그 추가:
```typescript
export default function ClientLayout({ children }: ClientLayoutProps) {
  console.log('ClientLayout mounted!');
  // ...
}
```
**결과**: ClientLayout 마운트 로그도 출력되지 않음

### 5단계: JavaScript 에러 확인
브라우저 개발자 도구 Console 탭에서 에러 발견:

```
Uncaught EvalError: Refused to evaluate a string as JavaScript because 'unsafe-eval' is not an allowed source of script in the following Content Security Policy directive: "script-src 'self' 'unsafe-inline' *.firebaseapp.com *.googleapis.com local.adguard.org".
```

## 🎯 근본 원인

**Content Security Policy (CSP) 제한으로 인한 React Hot Reload 차단**

- `middleware.ts`의 CSP 설정에서 `'unsafe-eval'`이 누락
- Next.js의 개발 모드에서 Hot Reload 기능이 `eval()` 함수를 사용
- CSP가 `eval()` 실행을 차단하여 클라이언트 사이드 JavaScript 실행 실패
- 결과적으로 React 컴포넌트의 하이드레이션(hydration) 실패

## ✅ 해결 방법

### 수정된 코드
`middleware.ts` 파일의 CSP 설정 수정:

```typescript
// CSP configuration based on environment
const getCSPValues = () => {
  const baseCSP = [
    "default-src 'self'",
    "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
    "font-src 'self' fonts.gstatic.com",
    "img-src 'self' data: blob:",
    "connect-src 'self' *.firebase.com *.firebaseio.com *.googleapis.com",
    "frame-ancestors 'none'",
    "base-uri 'self'"
  ];

  if (process.env.NODE_ENV === 'development') {
    // Development: Full permissions for hot reload
    baseCSP.push("script-src 'self' 'unsafe-inline' 'unsafe-eval' *.firebaseapp.com *.googleapis.com local.adguard.org");
  } else {
    // Production: Allow 'unsafe-eval' for Next.js dynamic imports
    baseCSP.push("script-src 'self' 'unsafe-inline' 'unsafe-eval' *.firebaseapp.com *.googleapis.com");
  }

  return baseCSP.join('; ');
};

const CSP_VALUES = getCSPValues();
```

### 주요 변경사항
- **개발 환경**: Hot Reload를 위한 `'unsafe-eval'` 및 개발 도구 지원
- **프로덕션 환경**: Next.js dynamic imports를 위한 `'unsafe-eval'` 포함
- 환경별 CSP 정책 세분화
- 향후 nonce-based CSP 적용 고려사항 주석 추가

## 🔄 검증 과정

### 수정 후 확인 사항
1. ✅ CSP 에러 해결
2. ✅ `ClientLayout mounted!` 로그 출력
3. ✅ `CurrentDirectory component mounted!` 로그 출력
4. ✅ `useCurrentDirectory` 훅 정상 실행
5. ✅ API 호출 및 데이터 수신 정상
6. ✅ 루트 디렉토리에서 파일 트리 정상 렌더링

## 📚 학습 포인트

### 1. CSP와 개발 환경의 관계
- Next.js 개발 모드는 Hot Reload를 위해 `eval()` 사용
- 보안을 위한 CSP 정책이 개발 편의성과 충돌할 수 있음
- 환경별 CSP 정책 분리의 중요성

### 2. 디버깅 접근법
- **API → 컴포넌트 → 훅** 순서로 단계적 디버깅
- 서버 로그와 클라이언트 로그의 차이점 주목
- 브라우저 개발자 도구의 Console 에러 메시지 우선 확인

### 3. Next.js SSR/CSR 이슈
- 서버 사이드에서는 정상이지만 클라이언트에서 실패하는 경우
- 하이드레이션 실패의 다양한 원인들
- CSP, CORS, JavaScript 에러 등의 연관성

## 🛡️ 보안 고려사항

- `'unsafe-eval'`은 XSS 공격 벡터가 될 수 있는 보안 취약점
- **Next.js 요구사항**: dynamic imports와 code splitting을 위해 필수적
- **개발 환경**: Hot Reload 기능을 위해 필요
- **프로덕션 환경**: Next.js 런타임 기능을 위해 현재 필요하지만, 향후 개선 방안 고려

### 향후 보안 개선 방안
1. **Nonce-based CSP**: 스크립트마다 고유한 nonce 값 사용
2. **Strict CSP**: 가능한 한 `'unsafe-eval'` 없이 동작하도록 Next.js 설정 최적화
3. **CSP 레벨 3**: hash-based 또는 nonce-based 정책으로 전환

## 🔧 예방 방법

1. **개발 초기 CSP 설정 검토**
2. **환경별 보안 정책 수립**
3. **정기적인 보안 헤더 점검**
4. **개발/프로덕션 환경 차이점 문서화**

---

**해결 일시**: 2025-01-24  
**관련 파일**: `middleware.ts`, `useCurrentDirectory.ts`, `CurrentDirectory.tsx`  
**키워드**: CSP, Next.js, Hot Reload, 하이드레이션, unsafe-eval