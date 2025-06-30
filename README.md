# doo_sync_obsidian

이 프로젝트는 옵시디언 저장소에 있는 마크다운 파일을 Next.js로 렌더링하는 위키 서비스입니다. GitHub 웹훅을 통해 노트를 동기화하며, Firebase 인증으로 접근을 제어합니다.

## 주요 기능

- **Next.js 14**와 TypeScript 기반의 애플리케이션
- **Tailwind CSS**와 커스텀 타이포그래피 적용
- 로그인과 역할 관리를 위한 **Firebase Authentication**
- 페이지 접근을 관리하고 익명 방문 횟수를 기록하는 **미들웨어**
- 옵시디언 마크다운을 HTML로 변환하고 `git pull`을 실행하는 **API 라우트**
- 게시된 페이지를 위한 **사이트맵 생성**

## 시작하기

1. 의존성 설치
   ```bash
   npm install
   ```
2. `.env_sample`을 `.env`로 복사한 뒤 `SERVER_DOMAIN`, `REPO_PATH`, `OBSIDIAN_URL`, Firebase 키,
   `GITHUB_WEBHOOK_SECRET`, `SITE_NAME`, `SITE_URL`, `SITE_AUTHOR` 등 필요한 값을 입력합니다.
3. 개발 서버 실행
   ```bash
   npm run dev
   ```
   기본 포트는 `33000`입니다.

## Firebase 설정

이 프로젝트는 Firebase Authentication을 사용합니다. 배포하기 전에 다음 단계를 완료해야 합니다:

### 1. Firebase 프로젝트 생성
1. [Firebase Console](https://console.firebase.google.com/)에서 새 프로젝트를 생성하세요.
2. Authentication을 활성화하고 필요한 로그인 방법(Google, 이메일/비밀번호 등)을 설정하세요.
3. 프로젝트 설정에서 웹 앱을 추가하고 Firebase 구성 정보를 얻으세요.

### 2. Firebase 구성 파일 설정
1. `.firebaserc` 파일에서 `"your-firebase-project-id"`를 실제 Firebase 프로젝트 ID로 변경하세요:
   ```json
   {
     "projects": {
       "default": "실제-프로젝트-id"
     }
   }
   ```

2. `.env` 파일에 Firebase 구성 정보를 추가하세요:
   ```bash
   # Firebase 클라이언트 설정
   NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
   
   # Firebase Admin SDK 설정
   FIREBASE_PRIVATE_KEY=your-private-key
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_CLIENT_EMAIL=your-service-account-email
   FIREBASE_PRIVATE_KEY_ID=your-private-key-id
   FIREBASE_CLIENT_ID=your-client-id
   GOOGLE_CLOUD_CLIENT_X509_CERT_URL=your-cert-url
   FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
   
   # 사이트 정보 (필수)
   SITE_NAME=your-site-name
   SITE_URL=https://your-site-url.com
   SITE_AUTHOR=your-name
   ```

### 3. Firebase Admin SDK 설정 (선택사항)
서버 사이드 Firebase 기능을 사용하려면 Firebase Admin SDK를 설정하세요:
1. Firebase Console에서 서비스 계정 키를 생성하세요.
2. 환경 변수에 서비스 계정 정보를 추가하세요.

## 배포

아래 명령으로 프로덕션 서버를 빌드하고 실행합니다.

```bash
npm run build
npm run start
```

`ecosystem.config.js`에 PM2 예시 설정이 포함되어 있습니다.

## 프로젝트 구조

- `app/` – Next.js 라우트, 컴포넌트와 유틸리티
- `services/` – 서버 사이드 서비스 함수들
- `public/` – 정적 자산
- `.env_sample` – 환경 변수 예시 파일 (`SITE_NAME`, `SITE_URL`, `SITE_AUTHOR`, `OBSIDIAN_URL` 등)

노트는 `REPO_PATH/Root`에서 읽어와 페이지로 제공합니다. GitHub에서 `push` 웹훅이 오면 API가 `git pull`을 실행해 최신 내용을 반영합니다.

## 환경 변수 설명

### OBSIDIAN_URL
이 환경 변수는 Obsidian vault나 프로젝트의 식별자를 설정합니다. 미들웨어에서 이 값을 사용해 `x-obsidian-url` HTTP 헤더를 설정합니다.

**용도:**
- 클라이언트 애플리케이션이나 API에서 현재 Obsidian vault의 식별자를 알 수 있게 함
- 다중 vault 환경에서 각각을 구분하기 위한 식별자 역할
- 로깅이나 분석 목적으로 vault별 구분이 필요할 때 사용

**설정 예시:**
```bash
OBSIDIAN_URL=my-knowledge-base
# 또는
OBSIDIAN_URL=team-docs
# 또는  
OBSIDIAN_URL=personal-notes
```

**기본값:** `obsidian` (환경 변수가 설정되지 않은 경우)

### x-obsidian-url 헤더
미들웨어(`middleware.ts`)에서 모든 요청에 `x-obsidian-url` 헤더를 자동으로 추가합니다. 이 헤더는 `OBSIDIAN_URL` 환경 변수의 값을 포함합니다.

**사용 사례:**
- API 응답에서 현재 vault 식별자 확인
- 클라이언트 측에서 서버의 vault 정보 접근
- 다중 인스턴스 환경에서의 요청 라우팅
- 디버깅 및 모니터링 목적

## 설정 파일 관리

### Private Folders 설정
개인 폴더 목록을 외부 설정 파일로 관리할 수 있습니다.

**환경 변수:**
```bash
PRIVATE_FOLDERS_FILE=config/private-folders.md
```

**설정 파일 형식 (config/private-folders.md):**
```markdown
# Private Folders Configuration

- /1. 일지
- /7. 생각정리  
- /8. 루틴
- /97. 보안 폴더
- /98. 미분류
- /99. 일기
```

- 마크다운 형식의 불릿 포인트(`-` 또는 `*`) 사용
- 직접 경로 입력 (`/폴더명`)
- 빈 줄과 주석(`#` 또는 `//`로 시작) 무시
- 파일이 없으면 기본 폴더 목록 사용

**테스트:**
```bash
npm test -- privateFoldersService.test.js
```

### Page Permissions 설정
페이지별 권한 설정을 외부 JSON 파일로 관리할 수 있습니다.

**환경 변수:**
```bash
PAGE_PERMISSIONS_FILE=config/page-permissions.json
```

**설정 파일 형식 (config/page-permissions.json):**
```json
[
  {
    "path": "/",
    "allowedRoles": [],
    "isPublic": true
  },
  {
    "path": "/1. 일지*",
    "allowedRoles": ["ADMIN"],
    "isPublic": false
  },
  {
    "path": "/8. 루틴*",
    "allowedRoles": ["ADMIN", "VERIFIED"],
    "isPublic": false
  }
]
```

**필드 설명:**
- `path`: 페이지 경로 (와일드카드 `*` 지원)
- `allowedRoles`: 접근 가능한 사용자 역할 배열
- `isPublic`: 공개 페이지 여부

**사용 가능한 역할:**
- `ADMIN`: 관리자
- `VERIFIED`: 인증된 사용자
- `GUEST`: 게스트 사용자
- `ANONYMOUS`: 익명 사용자

설정 파일이 없으면 기본 권한 설정을 사용합니다.

### Special Pages 설정
특정 페이지에 대한 특별한 디렉토리 표시 로직을 외부 JSON 파일로 관리할 수 있습니다.

**환경 변수:**
```bash
SPECIAL_PAGES_FILE=config/special-pages.json
```

**설정 파일 형식 (config/special-pages.json):**
```json
{
  "Doo Wiki 란.md": [
    {
      "name": "Doo Wiki 작업노트",
      "path": "/0. about Doo Wiki/Doo Wiki 작업노트.md",
      "isDirectory": false
    },
    {
      "name": "Doo Wiki 남은 작업", 
      "path": "/0. about Doo Wiki/Doo Wiki 남은 작업.md",
      "isDirectory": false
    }
  ]
}
```

**필드 설명:**
- 키: 특별 처리할 페이지 경로의 일부 (pathname.includes()로 매칭)
- `name`: 표시할 항목 이름
- `path`: 링크할 경로
- `isDirectory`: 디렉토리 여부

설정 파일이 없으면 기본 특별 페이지 설정을 사용합니다.

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](../LICENSE) 파일을 참조하세요.
