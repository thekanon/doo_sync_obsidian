import React from "react";
import DOMPurify from "dompurify";
import { JSDOM } from "jsdom";
import {
  parse,
  HTMLElement,
  Node as HTMLNode,
  TextNode,
} from "node-html-parser";
import FileLink from "@/app/components/FileLink";
import { getHost, getServerUser, hasPermission } from "@/app/lib/utils";
import { UserRole } from "../types/user";

type Params = {
  slug: string[];
};

type ObsidianData = {
  content: string;
  createdAt?: string;
  updatedAt?: string;
};

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

            return (
              <FileLink
                key={node.rawText}
                href={props.href}
                text={directoryText}
                isDirectory
                isLocked={isLocked}
                createdAt={createdAt}
              />
            );
          } else {
            return (
              <FileLink
                key={node.rawText}
                href={props.href}
                text={text}
                createdAt={createdAt}
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
          }> => React.isValidElement(child) && !!child.props.href
        );

        const directories = links.filter((link) => link.props.isDirectory);
        const files = links.filter((link) => !link.props.isDirectory);

        return React.createElement("p", { key: node.rawText }, [
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
}: {
  content: string;
  path: string;
  role?: UserRole;
  updatedAt?: string;
  createdAt?: string;
}) {
  const parsedContent = React.useMemo(
    () => parseHtmlToReact(content, path, role, updatedAt, createdAt),
    [content, path, role, updatedAt, createdAt]
  );

  return (
    <div className="w-full sm:min-w-[600px] md:min-w-[800px] lg:min-w-[1000px] xl:min-w-[1200px] 2xl:min-w-[1400px]">
      {React.Children.map(parsedContent, (child, index) => {
        if (
          React.isValidElement<{ className?: string }>(child) && // 클래스 속성 확인
          typeof child.type === "string" && // DOM 요소인지 확인
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

    console.log(data.updatedAt, data.createdAt);

    return (
      <div>
        <div className="prose prose-sm p-3 pt-0 flex flex-col items-center flex-grow flex-shrink-0 w-full max-w-full">
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
