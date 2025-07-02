import React from "react";
import { UserRole } from "@/app/types/user";
import { DirectoryFile } from "@/app/lib/obsidian/parser";

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
}: UseContentProcessingProps): React.ReactNode {
  const parsedContent = React.useMemo(() => {
    // HTML 파싱 대신 dangerouslySetInnerHTML 사용하여 직접 렌더링
    return React.createElement('div', {
      dangerouslySetInnerHTML: { __html: content }
    });
  }, [content]);

  return parsedContent;
}