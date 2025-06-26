"use client";
import { useState } from "react";
import Link from "next/link";

interface DirectoryItem {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: DirectoryItem[];
}

interface SidebarProps {
  directories: DirectoryItem[];
}

export default function Sidebar({ directories }: SidebarProps) {
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());

  const toggleDirectory = (path: string) => {
    const newExpanded = new Set(expandedDirs);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedDirs(newExpanded);
  };

  const renderDirectoryTree = (items: DirectoryItem[], level = 0) => {
    return items.map((item) => (
      <div key={item.path} style={{ marginLeft: `${level * 16}px` }}>
        <div className="flex items-center py-1 hover:bg-gray-100 rounded-md px-2">
          {item.isDirectory ? (
            <>
              <button
                onClick={() => toggleDirectory(item.path)}
                className="mr-2 text-gray-500 hover:text-gray-700"
              >
                {expandedDirs.has(item.path) ? "▼" : "▶"}
              </button>
              <Link
                href={`/${item.path}`}
                className="text-gray-700 hover:text-blue-600 font-medium"
              >
                📁 {item.name}
              </Link>
            </>
          ) : (
            <Link
              href={`/${item.path}`}
              className="text-gray-600 hover:text-blue-600 ml-6"
            >
              📄 {item.name}
            </Link>
          )}
        </div>
        {item.isDirectory && expandedDirs.has(item.path) && item.children && (
          <div>
            {renderDirectoryTree(item.children, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 h-full overflow-y-auto">
      <div className="p-4">
        <h2 className="font-bold text-lg mb-4 text-gray-800">Categories</h2>
        <div className="space-y-1">
          {renderDirectoryTree(directories)}
        </div>
      </div>
    </div>
  );
}