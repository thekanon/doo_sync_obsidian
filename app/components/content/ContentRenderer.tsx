import React from "react";
import { UserRole } from "@/app/types/user";
import { DirectoryFile } from "@/app/lib/obsidian/parser";
import { useContentProcessing } from "@/app/hooks/useContentProcessing";
import { getFileTitle } from "@/app/lib/obsidian/content-processor";
import FileMetadata from "./FileMetadata";
import FileLink from "@/app/components/FileLink";

interface ContentRendererProps {
  content: string;
  path: string;
  role?: UserRole;
  updatedAt?: string;
  createdAt?: string;
  directoryFiles?: DirectoryFile[];
}

export default React.memo(function ContentRenderer({
  content,
  path,
  role,
  updatedAt,
  createdAt,
  directoryFiles,
}: ContentRendererProps) {
  const parsedContent = useContentProcessing({
    content,
    path,
    role,
    updatedAt,
    createdAt,
    directoryFiles,
  });

  const fileTitle = React.useMemo(() => getFileTitle(path), [path]);

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      <div className="prose prose-lg max-w-full overflow-x-hidden break-words overflow-y-hidden">
        {fileTitle && (
          <FileMetadata
            title={fileTitle}
            updatedAt={updatedAt}
            createdAt={createdAt}
          />
        )}

        {React.Children.map(parsedContent, (child, index) => {
          // Replace file link placeholders with actual FileLink components
          if (React.isValidElement(child)) {
            const processElement = (element: React.ReactElement): React.ReactElement => {
              if (
                element.type === "div" &&
                element.props["data-file-link"] === "true"
              ) {
                return (
                  <FileLink
                    key={element.key}
                    href={element.props["data-href"]}
                    text={element.props["data-text"]}
                    isDirectory={element.props["data-is-directory"] === "true"}
                    isLocked={element.props["data-is-locked"] === "true"}
                    createdAt={element.props["data-created-at"]}
                    updatedAt={element.props["data-updated-at"]}
                  />
                );
              }

              // Process children recursively
              if (element.props.children) {
                const processedChildren = React.Children.map(
                  element.props.children,
                  (childElement) => {
                    if (React.isValidElement(childElement)) {
                      return processElement(childElement);
                    }
                    return childElement;
                  }
                );
                return React.cloneElement(element, {}, processedChildren);
              }

              return element;
            };

            const processedChild = processElement(child);

            // Apply mt-0 class to first paragraph
            if (
              processedChild.type === "p" &&
              index === 0 &&
              typeof processedChild.props.className === "string"
            ) {
              return React.cloneElement(processedChild, {
                className: `${processedChild.props.className || ""} mt-0`.trim(),
              });
            }

            return processedChild;
          }
          return child;
        })}
      </div>
    </div>
  );
});