# 주요 모듈 테스트 코드 자동 생성 명령 (인증/컴포넌트/API 커버리지 향상)
/sc:implement --scope project --persona-qa --persona-dev --ultrathink --validate
--task "다음 영역에 대해 우선순위 기반 테스트 코드를 상세하게 작성해 주세요"
--modules "1) Firebase 인증 로직 (auth/firebaseAuthentication.ts), 2) 인증 API (api/auth/route.ts), 3) 현재 디렉토리 API (api/current-directory/route.ts), 4) AuthUI 컴포넌트"
--testTypes "unit, integration, component"
--frameworks "Node.js native test runner, React Testing Library (권장), 또는 Jest/Vitest"
--outputFormat "test 폴더 구조 포함, TypeScript 기반 테스트 코드, 각 테스트 설명 포함"
--goal "1차적으로 40% 이상 커버리지를 달성하기 위한 테스트 코드 보완"

# 테스트 가이드 문서 작성
/sc:document --scope project --persona-qa --ultrathink --validate
--task "작성된 테스트 목록 정리 및 테스트 실행 방법에 대한 상세 가이드 문서를 docs 디렉토리에 작성해 주세요"
--output "docs/test-guide.md"
--includes "1) 테스트 파일/모듈 목록, 2) 테스트 유형(unit/integration/component), 3) 사용된 테스트 러너 및 설정, 4) 실행 방법(npm/pnpm 스크립트 등), 5) 커버리지 리포트 확인 방법, 6) 테스트 추가 시 규칙 및 위치"
--format "Markdown 형식의 문서"

# 루틴
- 기능 추가 후 테스트 스크립트 작성
- 테스트 스크립트 작성 후 테스트 및 testing-summary.md 업데이트

