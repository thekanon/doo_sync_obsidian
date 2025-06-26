import dynamic from "next/dynamic";
import React from "react";
import DOMPurify from "dompurify";
import { JSDOM } from "jsdom";
import {
  parse,
  HTMLElement,
  Node as HTMLNode,
  TextNode,
} from "node-html-parser";
import { getHost, getServerUser, hasPermission } from "@/app/lib/utils";
import { UserRole } from "../types/user";

type Params = {
  slug: string[];
};

type ObsidianData = {
  content: string;
  createdAt?: string;
  updatedAt?: string;
  directoryFiles?: Array<{
    name: string;
    updatedAt: string;
    createdAt: string;
    isDirectory: boolean;
  }>;
};

const FileLink = dynamic(() => import("@/app/components/FileLink"), {
  ssr: true,
});

function parseHtmlToReact(
  html: string,
  path: string,
  role?: UserRole,
  updatedAt?: string,
  createdAt?: string,
  directoryFiles?: Array<{
    name: string;
    updatedAt: string;
    createdAt: string;
    isDirectory: boolean;
  }>
): React.ReactNode {
  const window = new JSDOM("").window;
  const purify = DOMPurify(window);
  const sanitizedHtml = purify.sanitize(html);
  const root = parse(sanitizedHtml);

  const decodedPath = decodeURIComponent(path);
  const isIndexPage =
    decodedPath
      .split("/")
      [decodedPath.split("/").length - 1].indexOf("_Index_of_") !== -1;

  const voidElements = new Set(["br", "img", "hr", "input", "link", "meta"]);

  if (isIndexPage) {
    const brNodes = root.querySelectorAll("br");
    brNodes.forEach((brNode) => {
      const prevSibling = brNode.previousElementSibling;
      const nextSibling = brNode.nextElementSibling;
      if (
        prevSibling instanceof HTMLElement &&
        nextSibling instanceof HTMLElement &&
        prevSibling.tagName === "A" &&
        nextSibling.tagName === "A"
      ) {
        brNode.remove();
      }
    });
  }

  const convertToReact = (node: HTMLNode): React.ReactNode => {
    if (node instanceof TextNode) {
      return node.text;
    }

    if (node instanceof HTMLElement) {
      const props = node.attributes;

      if (node.tagName.toLowerCase() === "input" && props.type === "checkbox") {
        (props as { checked: boolean | "" }).checked =
          props.checked === "" ? true : false;
      }

      if (node.tagName.toLowerCase() === "a") {
        if (!isIndexPage) {
          return React.createElement(
            "a",
            { key: node.rawText, ...props },
            node.childNodes.map(convertToReact)
          );
        } else {
          const text = node.childNodes.map(convertToReact).join("");
          if (text.startsWith("_Index_of_")) {
            const directoryText = text.replace(/_Index_of_/g, "");
            const isLocked = !hasPermission(role, props.href);

            const fileName =
              decodeURIComponent(props.href).split("/").pop() || "";
            const convertFileName = fileName
              .replace(/_Index_of_/g, "")
              .replace(/.md/g, "");
            const fileInfo = directoryFiles?.find(
              (f) => f.name === convertFileName
            );
            return (
              <FileLink
                key={node.rawText}
                href={props.href}
                text={directoryText}
                isDirectory
                isLocked={isLocked}
                createdAt={fileInfo?.updatedAt}
                updatedAt={fileInfo?.updatedAt}
              />
            );
          } else {
            const fileName =
              decodeURIComponent(props.href).split("/").pop() || "";
            const fileInfo = directoryFiles?.find((f) => f.name === fileName);

            return (
              <FileLink
                key={node.rawText}
                href={props.href}
                text={text}
                createdAt={fileInfo?.createdAt}
                updatedAt={fileInfo?.updatedAt}
              />
            );
          }
        }
      }

      if (isIndexPage && node.tagName.toLowerCase() === "p") {
        const childNodes = node.childNodes.map(convertToReact);

        const links = childNodes.filter(
          (
            child
          ): child is React.ReactElement<{
            href: string;
            isDirectory?: boolean;
            updatedAt?: string;
          }> => React.isValidElement(child) && !!child.props.href
        );

        // 루트 경로인지 확인
        const isRoot = path === "_Index_of_Root.md";

        // 디렉토리와 파일 분리
        let directories = links.filter((link) => link.props.isDirectory);
        let files = links.filter((link) => !link.props.isDirectory);

        // 루트가 아닐 때만 정렬 적용
        if (!isRoot) {
          directories = directories.sort((a, b) => {
            const dateA = a.props.updatedAt
              ? new Date(a.props.updatedAt)
              : new Date(0);
            const dateB = b.props.updatedAt
              ? new Date(b.props.updatedAt)
              : new Date(0);
            return dateB.getTime() - dateA.getTime();
          });

          files = files.sort((a, b) => {
            const dateA = a.props.updatedAt
              ? new Date(a.props.updatedAt)
              : new Date(0);
            const dateB = b.props.updatedAt
              ? new Date(b.props.updatedAt)
              : new Date(0);
            return dateB.getTime() - dateA.getTime();
          });
        }

        return React.createElement("div", { key: node.rawText }, [
          ...directories,
          ...files,
        ]);
      }

      const Component = node.tagName.toLowerCase();
      if (voidElements.has(Component)) {
        return React.createElement(Component, { key: node.rawText, ...props });
      }

      return React.createElement(
        Component,
        { key: node.rawText, ...props },
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
  directoryFiles,
}: {
  content: string;
  path: string;
  role?: UserRole;
  updatedAt?: string;
  createdAt?: string;
  directoryFiles?: Array<{
    name: string;
    updatedAt: string;
    createdAt: string;
    isDirectory: boolean;
  }>;
}) {
  const parsedContent = React.useMemo(
    () =>
      parseHtmlToReact(
        content,
        path,
        role,
        updatedAt,
        createdAt,
        directoryFiles
      ),
    [content, path, role, updatedAt, createdAt, directoryFiles]
  );

  // Extract file title from path for display (only for files, not directories)
  const getFileTitle = (pathString: string) => {
    // Skip if this is a directory index file
    if (pathString.includes("_Index_of_")) {
      return null;
    }

    // Extract filename and clean it up
    const pathParts = pathString.split("/");
    const fileName = pathParts[pathParts.length - 1];

    // Remove .md extension and decode URI components
    const title = decodeURIComponent(fileName)
      .replace(/\.md$/, "")
      .replace(/^\d+\.\s*/, ""); // Remove number prefixes like "4. "

    return title;
  };

  const fileTitle = getFileTitle(path);

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      <div className="prose prose-lg max-w-full overflow-x-hidden break-words overflow-y-hidden">
        {/* Display file title at the top (only for files, not directories) */}
        {fileTitle && (
          <div className="mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-gray-200 max-w-full overflow-hidden">
            <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-2 break-words">
              {fileTitle}
            </h1>
            <div className="flex flex-col sm:flex-row sm:items-center text-sm sm:text-base text-gray-500 space-y-1 sm:space-y-0 sm:space-x-4">
              {updatedAt && (
                <span className="break-all">
                  📅 Updated: {new Date(updatedAt).toLocaleDateString()}
                </span>
              )}
              {createdAt && (
                <span className="break-all">
                  📝 Created: {new Date(createdAt).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        )}

        {React.Children.map(parsedContent, (child, index) => {
          if (
            React.isValidElement<{ className?: string }>(child) &&
            typeof child.type === "string" &&
            child.type === "p" &&
            index === 0
          ) {
            return React.cloneElement(child, {
              className: `${child.props.className || ""} mt-0`.trim(),
            });
          }
          return child;
        })}
      </div>
    </div>
  );
}

async function fetchObsidianData(path: string): Promise<ObsidianData> {
  const res = await fetch(`${getHost()}/api/${path}`, {
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch data: ${res.statusText}`);
  }

  return await res.json();
}

export default async function Page({ params }: { params: Params }) {
  try {
    const path = params.slug.join("/");
    const data = await fetchObsidianData(path);
    const user = await getServerUser();

    return (
      <div className="w-full">
        <CustomContent
          content={data.content}
          path={path}
          role={user?.role}
          updatedAt={data.updatedAt}
          createdAt={data.createdAt}
          directoryFiles={data.directoryFiles}
        />
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
