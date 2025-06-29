import React from "react";

interface FileMetadataProps {
  title: string;
  updatedAt?: string;
  createdAt?: string;
}

export default function FileMetadata({ title, updatedAt, createdAt }: FileMetadataProps) {
  return (
    <div className="mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-gray-200 max-w-full overflow-hidden">
      <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-2 break-words">
        {title}
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
  );
}