import React from "react";
import DOMPurify from "dompurify";
import { JSDOM } from "jsdom";
import { parse } from "node-html-parser";
import FileLink from "@/app/components/FileLink";
import { getHost, getServerUser, hasPermission } from "@/app/lib/utils";
import { UserRole } from "../types/user";

type Params = {
  slug: string[]; // URL 경로를 나타내는 문자열 배열
};

type ObsidianData = {
  content: string; // Obsidian에서 가져온 콘텐츠
  createdAt?: string; // 생성일
  updatedAt?: string; // 수정일
};

/**
 * HTML 문자열을 파싱하여 React 컴포넌트로 변환
 */
function parseHtmlToReact(
  html: string,
  path: string,
  role?: UserRole,
  updatedAt?: string,
  createdAt?: string
): React.ReactNode {
  const window = new JSDOM("").window;
  const purify = DOMPurify(window as unknown as Window);
  const sanitizedHtml = purify.sanitize(html);
  const root = parse(sanitizedHtml);

  const decodedPath = decodeURIComponent(path);
  const isIndexPage =
    decodedPath
      .split("/")
      [decodedPath.split("/").length - 1].indexOf("_Index_of_") !== -1;

  const voidElements = new Set(["br", "img", "hr", "input", "link", "meta"]);

  // BR 태그 제거 로직
  if (isIndexPage) {
    const brNodes = root.querySelectorAll("br");
    brNodes.forEach((brNode) => {
      const prevSibling = brNode.previousElementSibling;
      const nextSibling = brNode.nextElementSibling;
      if (prevSibling?.tagName === "A" && nextSibling?.tagName === "A") {
        brNode.remove();
      }
    });
  }

  const convertToReact = (node: any): React.ReactNode => {
    // nodeType: 3 - Text, 1 - Element
    if (node.nodeType === 3) return node.text;
    if (node.nodeType === 1) {
      const props = node.attributes
        ? Object.keys(node.attributes).reduce((acc: any, key: string) => {
            if (node.attributes[key]) {
              acc[key] = node.attributes[key];
            }
            return acc;
          }, {})
        : {};

      if (node.tagName?.toLowerCase() === "a") {
        if (!isIndexPage) {
          // isIndexPage가 아닌 경우 일반 a 태그로 처리
          return React.createElement(
            "a",
            { key: Math.random(), ...props },
            node.childNodes.map(convertToReact)
          );
        } else {
          let text = node.childNodes.map(convertToReact);
          if (text[0]?.startsWith("_Index_of_")) {
            const directoryText = text[0].replace(/_Index_of_/g, "");
            const isLocked = !hasPermission(role, node.attributes.href);

            return (
              <FileLink
                key={Math.random()}
                href={node.attributes.href}
                text={directoryText}
                isDirectory
                isLocked={isLocked}
                createdAt={createdAt}
              />
            );
          } else {
            return (
              <FileLink
                key={Math.random()}
                href={node.attributes.href}
                text={text}
                createdAt={createdAt}
              />
            );
          }
        }
      }

      if (isIndexPage && node.tagName?.toLowerCase() === "p") {
        // <p> 하위 요소를 재귀적으로 처리
        const childNodes = node.childNodes.map((childNode: any) =>
          convertToReact(childNode)
        );

        // 하위 요소 중에서 링크만 추출
        const links = childNodes.filter(
          (
            child: any
          ): child is React.ReactElement<{
            href: string;
            isDirectory?: boolean;
          }> =>
            React.isValidElement(child) &&
            !!(child as React.ReactElement).props.href // 링크인지 확인
        );

        // 디렉토리와 파일로 분리
        const directories = links.filter(
          (
            link: React.ReactElement<
              any,
              string | React.JSXElementConstructor<any>
            >
          ) => (link as React.ReactElement).props.isDirectory
        );
        const files = links.filter(
          (link: { props: { isDirectory: any } }) => !link.props.isDirectory
        );

        // 디렉토리 먼저 정렬된 링크 요소를 포함하는 새로운 <p> 태그 생성
        return React.createElement("p", { key: Math.random() }, [
          ...directories,
          ...files,
        ]);
      }

      const Component = node.tagName.toLowerCase();
      if (voidElements.has(Component)) {
        return React.createElement(Component, { key: Math.random(), ...props });
      }

      return React.createElement(
        Component,
        { key: Math.random(), ...props },
        node.childNodes.map(convertToReact)
      );
    }
    return null;
  };

  const elements = root.childNodes.map(convertToReact);

  return elements;
}

function CustomContent({
  content,
  path,
  role,
  updatedAt,
  createdAt,
}: {
  content: string;
  path: string;
  role?: UserRole;
  updatedAt?: string;
  createdAt?: string;
}) {
  const parsedContent = React.useMemo(
    () => parseHtmlToReact(content, path, role, updatedAt, createdAt),
    [content]
  );

  return <div>{parsedContent}</div>;
}

/**
 * Obsidian 데이터를 가져오는 함수
 * @param path - API 요청 경로
 * @returns Promise<ObsidianData>
 */
async function fetchObsidianData(path: string): Promise<ObsidianData> {
  const res = await fetch(`${getHost()}/api/${path}`, {
    next: { revalidate: 60 }, // 60초마다 데이터 재검증
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch data: ${res.statusText}`);
  }

  return await res.json();
}

/**
 * 메인 홈 컴포넌트
 * Obsidian 콘텐츠를 가져와서 안전하게 렌더링
 */
export default async function Page({ params }: { params: Params }) {
  try {
    const path = params.slug.join("/");
    const data = await fetchObsidianData(path);
    const user = await getServerUser();

    console.log(data.updatedAt, data.createdAt);

    return (
      <div>
        <div
          className="prose prose-lg p-3
          flex flex-col items-center flex-grow flex-shrink-0 w-full max-w-full
        "
        >
          <CustomContent
            content={data.content}
            path={path}
            role={user?.role}
            updatedAt={data.updatedAt}
            createdAt={data.createdAt}
          />
        </div>
      </div>
    );
  } catch (error: unknown) {
    console.error("Error in Home component:", error);
    return (
      <div className="prose prose-lg p-3">
        없는 문서이거나 아직 작성되지 않았습니다.
      </div>
    );
  }
}
