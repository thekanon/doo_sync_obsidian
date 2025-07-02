import DOMPurify from "dompurify";
import { JSDOM } from "jsdom";

export function sanitizeHtml(html: string): string {
  const window = new JSDOM("").window;
  const purify = DOMPurify(window);
  
  // 안전한 HTML 태그와 속성들을 허용하도록 설정
  return purify.sanitize(html, {
    ALLOWED_TAGS: [
      // 기본 텍스트 태그들
      'p', 'br', 'strong', 'em', 'u', 's', 'sub', 'sup', 'mark',
      // 제목 태그들
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      // 목록 태그들
      'ul', 'ol', 'li',
      // 링크와 이미지
      'a', 'img',
      // 테이블 태그들
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      // 인용문과 구분선
      'blockquote', 'hr',
      // 코드 블록 태그들 (중요!)
      'pre', 'code',
      // 기타 인라인 태그들
      'span', 'div',
      // 체크박스를 위한 input
      'input'
    ],
    ALLOWED_ATTR: [
      // 링크 속성
      'href', 'target', 'rel',
      // 이미지 속성
      'src', 'alt', 'width', 'height',
      // 클래스와 ID (코드 하이라이팅을 위해 중요!)
      'class', 'id',
      // 체크박스 속성
      'type', 'checked', 'disabled',
      // 테이블 속성
      'colspan', 'rowspan',
      // 데이터 속성 (파일 링크용)
      'data-file-link', 'data-href', 'data-text', 'data-is-directory', 
      'data-is-locked', 'data-created-at', 'data-updated-at'
    ],
    // HTML 태그를 이스케이핑하지 않고 제거만 함
    KEEP_CONTENT: true,
    // 허용되지 않은 태그의 내용은 유지
    ALLOW_UNKNOWN_PROTOCOLS: false,
    // 상대 URL 허용
    ALLOW_DATA_ATTR: true
  });
}

export function getFileTitle(pathString: string): string | null {
  if (pathString.includes("_Index_of_")) {
    return null;
  }

  const pathParts = pathString.split("/");
  const fileName = pathParts[pathParts.length - 1];

  const title = decodeURIComponent(fileName)
    .replace(/\.md$/, "")
    .replace(/^\d+\.\s*/, "");

  return title;
}

export function isIndexPage(path: string): boolean {
  const decodedPath = decodeURIComponent(path);
  return (
    decodedPath
      .split("/")
      [decodedPath.split("/").length - 1].indexOf("_Index_of_") !== -1
  );
}

const ROOT_DIR = process.env.OBSIDIAN_ROOT_DIR || 'Root';
export function isRootPath(path: string): boolean {
  return path === `_Index_of_${ROOT_DIR}.md`;
}