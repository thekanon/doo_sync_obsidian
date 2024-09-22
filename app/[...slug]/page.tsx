import React from "react";
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import { privatePathList } from "@/app/lib/contants";

type Params = {
  slug: string[];
};

type ObsidianData = {
  content: string;
};

// 비공개 페이지 체크 함수
function checkIfPrivatePage(path: string): boolean {
  return privatePathList.some(forbiddenPath => path.includes(encodeURI(forbiddenPath)));
}

// 콘텐츠를 안전하게 정리하는 함수
function sanitizeContent(content: string): string {
  const window = new JSDOM('').window;
  const purify = DOMPurify(window as unknown as Window);
  return purify.sanitize(content);
}

// 안전한 HTML 렌더링 컴포넌트
function SanitizedContent({ content }: { content: string }) {
  const sanitizedContent = React.useMemo(() => sanitizeContent(content), [content]);
  return <div dangerouslySetInnerHTML={{ __html: sanitizedContent }} />;
}

// Obsidian 데이터를 가져오는 함수
async function fetchObsidianData(path: string): Promise<ObsidianData> {
  const res = await fetch(`http://localhost:3000/api/${path}`, { next: { revalidate: 60 } });

  if (!res.ok) {
    throw new Error(`Failed to fetch data: ${res.statusText}`);
  }

  return await res.json();
}

// 비공개 페이지 여부 확인 후 데이터 가져오기
async function getObsidianData(params: string[]): Promise<ObsidianData> {
  const path = params.join('/');
  // 임시로 전부 공개 페이지로 처리
  if (checkIfPrivatePage(path)
    && false
  ) {
    throw new Error("This page is private.");
  }

  return fetchObsidianData(path);
}

// Home 컴포넌트
export default async function Home({ params }: { params: Params }) {
  try {
    const data = await getObsidianData(params.slug);

    return (
      <div>
        <div className="prose prose-lg p-3">
          <SanitizedContent content={data.content} />
        </div>
      </div>
    );
  } catch (error: unknown) {
    error instanceof Error &&
      console.error("Error in Home component:", error);

    // 비공개 페이지 에러일 경우 '권한이 없습니다' 출력
    const errorMessage = (error as Error).message === "This page is private."
      ? "권한이 없습니다."
      : "없는 문서이거나 아직 작성되지 않았습니다.";

    return (
      <div className="prose prose-lg p-3">
        {errorMessage}
      </div>
    );
  }
}
