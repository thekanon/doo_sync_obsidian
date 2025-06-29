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
2. `.env_sample`을 `.env`로 복사한 뒤 `SERVER_DOMAIN`, `REPO_PATH`, Firebase 키,
   `GITHUB_WEBHOOK_SECRET`, `SITE_NAME`, `SITE_URL`, `SITE_AUTHOR` 등 필요한 값을 입력합니다.
3. 개발 서버 실행
   ```bash
   npm run dev
   ```
   기본 포트는 `33000`입니다.

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
- `.env_sample` – 환경 변수 예시 파일 (`SITE_NAME`, `SITE_URL`, `SITE_AUTHOR` 등)

노트는 `REPO_PATH/Root`에서 읽어와 페이지로 제공합니다. GitHub에서 `push` 웹훅이 오면 API가 `git pull`을 실행해 최신 내용을 반영합니다.
