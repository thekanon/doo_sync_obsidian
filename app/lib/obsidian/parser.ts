import React from "react";
import { parse, HTMLElement, Node as HTMLNode, TextNode } from "node-html-parser";
import { UserRole } from "@/app/types/user";
import { hasPermission } from "@/app/lib/utils";

export type DirectoryFile = {
  name: string;
  updatedAt: string;
  createdAt: string;
  isDirectory: boolean;
};

export function parseHtmlToReact(
  html: string,
  path: string,
  role?: UserRole,
  updatedAt?: string,
  createdAt?: string,
  directoryFiles?: DirectoryFile[]
): React.ReactNode {
  // HTML 엔티티를 원래 문자로 디코딩
  const decodedHtml = html
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
    
  // HTML 엔티티 디코딩을 방지하는 옵션 설정
  const root = parse(decodedHtml, {
    lowerCaseTagName: false,
    comment: false,
    blockTextElements: {
      script: true,
      noscript: true,
      style: true,
      pre: true, // pre 태그 내부 텍스트를 그대로 유지
    }
  });
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
        const checkboxProps = props as Record<string, string | boolean>;
        checkboxProps.checked = checkboxProps.checked === "" ? true : false;
      }

      if (node.tagName.toLowerCase() === "a") {
        return handleLinkElement(
          node,
          props,
          isIndexPage,
          role,
          directoryFiles
        );
      }

      if (isIndexPage && node.tagName.toLowerCase() === "p") {
        return handleParagraphElement(node, path, convertToReact);
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

function handleLinkElement(
  node: HTMLElement,
  props: Record<string, string>,
  isIndexPage: boolean,
  role?: UserRole,
  directoryFiles?: DirectoryFile[]
): React.ReactNode {
  if (!isIndexPage) {
    return React.createElement(
      "a",
      { key: node.rawText, ...props },
      node.childNodes.map((child) => convertNodeToReact(child))
    );
  }

  const text = node.childNodes.map((child) => convertNodeToReact(child)).join("");
  
  if (text.startsWith("_Index_of_")) {
    return createDirectoryFileLink(node, props, text, role, directoryFiles);
  } else {
    return createRegularFileLink(node, props, text, role, directoryFiles);
  }
}

function createDirectoryFileLink(
  node: HTMLElement,
  props: Record<string, string>,
  text: string,
  role?: UserRole,
  directoryFiles?: DirectoryFile[]
): React.ReactNode {
  const directoryText = text.replace(/_Index_of_/g, "");
  const isLocked = !hasPermission(role, props.href);

  const fileName = decodeURIComponent(props.href).split("/").pop() || "";
  const convertFileName = fileName
    .replace(/_Index_of_/g, "")
    .replace(/.md/g, "");
  const fileInfo = directoryFiles?.find((f) => f.name === convertFileName);

  // Return a placeholder that will be replaced by the actual FileLink component
  return React.createElement("div", {
    key: node.rawText,
    "data-file-link": "true",
    "data-href": props.href,
    "data-text": directoryText,
    "data-is-directory": "true",
    "data-is-locked": isLocked.toString(),
    "data-created-at": fileInfo?.createdAt,
    "data-updated-at": fileInfo?.updatedAt,
  }, directoryText);
}

function createRegularFileLink(
  node: HTMLElement,
  props: Record<string, string>,
  text: string,
  role?: UserRole,
  directoryFiles?: DirectoryFile[]
): React.ReactNode {
  const fileName = decodeURIComponent(props.href).split("/").pop() || "";
  const fileInfo = directoryFiles?.find((f) => f.name === fileName);

  // Add permission check for regular files
  const isLocked = !hasPermission(role, props.href);

  // Return a placeholder that will be replaced by the actual FileLink component
  return React.createElement("div", {
    key: node.rawText,
    "data-file-link": "true",
    "data-href": props.href,
    "data-text": text,
    "data-is-directory": "false",
    "data-is-locked": isLocked.toString(),
    "data-created-at": fileInfo?.createdAt,
    "data-updated-at": fileInfo?.updatedAt,
  }, text);
}

function handleParagraphElement(
  node: HTMLElement,
  path: string,
  convertToReact: (node: HTMLNode) => React.ReactNode
): React.ReactNode {
  const childNodes = node.childNodes.map(convertToReact);

  const links = childNodes.filter(
    (
      child
    ): child is React.ReactElement<{
      "data-href": string;
      "data-is-directory"?: string;
      "data-updated-at"?: string;
    }> => React.isValidElement(child) && !!child.props["data-href"]
  );

  const ROOT_DIR = process.env.OBSIDIAN_ROOT_DIR || 'Root';
  const isRoot = path === `_Index_of_${ROOT_DIR}.md`;

  let directories = links.filter((link) => link.props["data-is-directory"] === "true");
  let files = links.filter((link) => link.props["data-is-directory"] === "false");

  if (!isRoot) {
    directories = sortLinksByDate(directories);
    files = sortLinksByDate(files);
  }

  return React.createElement("div", { key: node.rawText }, [
    ...directories,
    ...files,
  ]);
}

function sortLinksByDate<T extends React.ReactElement<{ "data-updated-at"?: string }>>(
  links: T[]
): T[] {
  return links.sort((a, b) => {
    const dateA = a.props["data-updated-at"] ? new Date(a.props["data-updated-at"]) : new Date(0);
    const dateB = b.props["data-updated-at"] ? new Date(b.props["data-updated-at"]) : new Date(0);
    const timeA = isNaN(dateA.getTime()) ? 0 : dateA.getTime();
    const timeB = isNaN(dateB.getTime()) ? 0 : dateB.getTime();
    return timeB - timeA;
  });
}

function convertNodeToReact(node: HTMLNode): React.ReactNode {
  if (node instanceof TextNode) {
    return node.text;
  }
  if (node instanceof HTMLElement) {
    return React.createElement(
      node.tagName.toLowerCase(),
      node.attributes,
      node.childNodes.map(convertNodeToReact)
    );
  }
  return null;
}