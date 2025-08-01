import DOMPurify, { WindowLike } from "dompurify";
import { JSDOM } from "jsdom";

export function sanitizeHtml(html: string): string {
  const window = new JSDOM("").window;
  const purify = DOMPurify(window as WindowLike);
  return purify.sanitize(html);
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