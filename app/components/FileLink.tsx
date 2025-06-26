import React, { memo } from "react";
import Link from "next/link";
import { File, Folder, Lock } from "lucide-react";

interface FileLinkProps {
  href: string;
  text: string;
  isDirectory?: boolean;
  isLocked?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const MemoizedText = React.memo(function MemoizedText({ text }: { text: string }) {
  return <span>{text}</span>;
});


export default memo(function FileLink({
  href,
  text,
  isDirectory = false,
  isLocked = false,
  updatedAt,
}: FileLinkProps) {
  const Icon = isDirectory ? Folder : File;
  const baseClasses =
    "flex items-start gap-3 p-3 rounded-lg transition-all duration-200 ease-in-out no-underline w-full border border-transparent hover:border-gray-200";
  const colorClasses = isLocked
    ? "text-gray-400 bg-gray-50 cursor-not-allowed"
    : "text-gray-800 hover:bg-gray-100";

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date
      .toLocaleDateString("ko-KR", {
        year: "2-digit",
        month: "2-digit",
        day: "2-digit",
      })
      .replace(/\. /g, "/")
      .replace(".", "");
  };

  return (
    <div className="mb-2 pb-2 border-b border-gray-100 last:border-b-0">
      <Link
        href={isLocked ? "/unauthorized" : href}
        className={`
          ${baseClasses}
          ${colorClasses}
          ${!isLocked && "hover:shadow-sm"}
        `}
        aria-disabled={isLocked}
      >
        {/* Left section with icon and title */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <Icon
            className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
              isDirectory ? "text-blue-500" : "text-amber-500"
            }`}
          />
          <div className="min-w-0 flex-1">
            <div className="text-base sm:text-sm font-medium leading-5 break-words overflow-wrap-anywhere">
              <MemoizedText text={text} />
            </div>
          </div>
        </div>

        {/* Right section with date and lock icon */}
        <div className="flex items-center gap-2 flex-shrink-0 ml-4">
          {isLocked && <Lock className="w-4 h-4 text-gray-400" />}
          {updatedAt && (
            <div className="text-sm sm:text-xs text-gray-500 whitespace-nowrap min-w-[60px] text-right">
              {formatDate(updatedAt)}
            </div>
          )}
        </div>
      </Link>
    </div>
  );
})