import React from "react";
import Link from "next/link";
import { File, Folder, Lock } from "lucide-react";

interface FileLinkProps {
  href: string;
  text: string;
  isDirectory?: boolean;
  isLocked?: boolean;
  createdAt?: string;
}

export default function FileLink({
  href,
  text,
  isDirectory = false,
  isLocked = false,
  createdAt,
}: FileLinkProps) {
  const Icon = isDirectory ? Folder : File;
  const baseClasses =
    "flex items-center gap-3 p-2.5 rounded-lg transition-all duration-200 ease-in-out no-underline w-full sm:min-w-[600px] md:min-w-[800px] lg:min-w-[1000px] xl:min-w-[1200px] 2xl:min-w-[1400px]";
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
    <Link
      href={isLocked ? "/unauthorized" : href}
      className={`
        ${baseClasses}
        ${colorClasses}
        ${!isLocked && "hover:shadow-sm"}
      `}
    >
      <span className="flex items-center gap-3 min-w-0">
        <Icon
          className={`w-5 h-5 flex-shrink-0 ${
            isDirectory ? "text-blue-500" : "text-amber-500"
          }`}
        />
        <span className="font-medium break-keep">{text}</span>
      </span>

      <span className="flex items-center ml-auto gap-3">
        {isLocked && <Lock className="w-4 h-4 text-gray-400" />}
        {createdAt && (
          <span className="text-sm text-gray-500 scale-75 origin-left">
            {formatDate(createdAt)}
          </span>
        )}
      </span>
    </Link>
  );
}
