import Link from "next/link";
import { DirectoryItem } from "@/app/hooks/useCurrentDirectory";
import { File, Folder, Lock } from "lucide-react";

interface DirectoryTreeProps {
  items: DirectoryItem[];
  expandedDirs: Set<string>;
  pathname: string | null;
  onToggleDirectory: (path: string) => void;
}

export default function DirectoryTree({
  items,
  expandedDirs,
  pathname,
  onToggleDirectory,
}: DirectoryTreeProps) {
  const renderDirectoryTree = (items: DirectoryItem[], level = 0) => {
    const currentPath = pathname
      ? decodeURIComponent(
          pathname.startsWith("/") ? pathname.slice(1) : pathname
        )
      : "";

    return items.map((item) => {
      // Check if this item is the current file/directory
      const isCurrentItem =
        currentPath === item.path ||
        currentPath.endsWith(item.path) ||
        item.path.endsWith(currentPath);

      // Apply FileLink-style disabled state for locked items
      const Icon = item.isDirectory ? Folder : File;
      const baseClasses = "flex items-center py-1 rounded-md px-2 transition-colors";
      const colorClasses = item.isLocked
        ? "text-gray-400 bg-gray-50 cursor-not-allowed"
        : isCurrentItem
        ? "bg-blue-100 border-l-4 border-blue-500"
        : "hover:bg-gray-100";

      return (
        <div key={item.path} style={{ marginLeft: `${level * 16}px` }}>
          <div className={`${baseClasses} ${colorClasses}`}>
            {item.isDirectory ? (
              <>
                <button
                  onClick={() => onToggleDirectory(item.path)}
                  className={`mr-2 flex-shrink-0 ${
                    item.isLocked
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                  disabled={item.isLocked}
                >
                  {expandedDirs.has(item.path) ? "▼" : "▶"}
                </button>
                <Link
                  href={item.isLocked ? "/unauthorized" : item.path}
                  className={`font-medium flex-1 flex items-center gap-2 ${
                    item.isLocked
                      ? "text-gray-400 cursor-not-allowed"
                      : isCurrentItem
                      ? "text-blue-700 font-bold"
                      : "text-gray-700 hover:text-blue-600"
                  }`}
                  style={{ wordBreak: 'keep-all' }}
                  aria-disabled={item.isLocked}
                >
                  <Icon className={`w-4 h-4 ${item.isDirectory ? "text-blue-500" : "text-amber-500"}`} />
                  {item.name}
                  {item.isLocked && <Lock className="w-3 h-3 text-gray-400" />}
                </Link>
                {isCurrentItem && !item.isLocked && (
                  <span className="text-blue-600 text-xs ml-2">📍</span>
                )}
              </>
            ) : (
              <>
                <div className="w-6 flex-shrink-0"></div>
                <Link
                  href={item.isLocked ? "/unauthorized" : item.path}
                  className={`flex-1 flex items-center gap-2 ${
                    item.isLocked
                      ? "text-gray-400 cursor-not-allowed"
                      : isCurrentItem
                      ? "text-blue-700 font-bold"
                      : "text-gray-600 hover:text-blue-600"
                  }`}
                  style={{ wordBreak: 'keep-all' }}
                  aria-disabled={item.isLocked}
                >
                  <Icon className={`w-4 h-4 ${item.isDirectory ? "text-blue-500" : "text-amber-500"}`} />
                  {item.name}
                  {item.isLocked && <Lock className="w-3 h-3 text-gray-400" />}
                </Link>
                {isCurrentItem && !item.isLocked && (
                  <span className="text-blue-600 text-xs ml-2">📍</span>
                )}
              </>
            )}
          </div>
          {item.isDirectory && expandedDirs.has(item.path) && item.children && !item.isLocked && (
            <div>{renderDirectoryTree(item.children, level + 1)}</div>
          )}
        </div>
      );
    });
  };

  return <div className="space-y-1">{renderDirectoryTree(items)}</div>;
}