import React from "react";
import { UserRole } from "@/app/types/user";
import { DirectoryFile, parseHtmlToReact } from "@/app/lib/obsidian/parser";
import { sanitizeHtml } from "@/app/lib/obsidian/content-processor";

interface UseContentProcessingProps {
  content: string;
  path: string;
  role?: UserRole;
  updatedAt?: string;
  createdAt?: string;
  directoryFiles?: DirectoryFile[];
}

export function useContentProcessing({
  content,
  path,
  role,
  updatedAt,
  createdAt,
  directoryFiles,
}: UseContentProcessingProps): React.ReactNode {
  const parsedContent = React.useMemo(() => {
    const sanitizedContent = sanitizeHtml(content);
    return parseHtmlToReact(
      sanitizedContent,
      path,
      role,
      updatedAt,
      createdAt,
      directoryFiles
    );
  }, [content, path, role, updatedAt, createdAt, directoryFiles]);

  return parsedContent;
}