"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

interface DirectoryItem {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: DirectoryItem[];
  modifiedAt?: string;
}

function CurrentDirectoryComponent() {
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());
  const [currentDirItems, setCurrentDirItems] = useState<DirectoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();

  // Fetch current directory contents via API
  useEffect(() => {
    if (!pathname) return;

    const fetchCurrentDirectory = async () => {
      setLoading(true);
      try {
        // Special handling for "Doo Wiki 란.md" - show the 3 specific files
        if (pathname.includes("Doo Wiki 란.md")) {
          const specificItems: DirectoryItem[] = [
            {
              name: "Doo Wiki 작업노트",
              path: "/0. about Doo Wiki/Doo Wiki 작업노트.md",
              isDirectory: false,
            },
            {
              name: "Doo Wiki 남은 작업",
              path: "/0. about Doo Wiki/Doo Wiki 남은 작업.md",
              isDirectory: false,
            },
            {
              name: "Doo Wiki 란",
              path: "/0. about Doo Wiki/Doo Wiki 란.md",
              isDirectory: false,
            },
          ];
          setCurrentDirItems(specificItems);
          setLoading(false);
          return;
        }

        // Call the API to get current directory contents
        const response = await fetch(
          `/api/current-directory?path=${encodeURIComponent(pathname)}`
        );

        if (!response.ok) {
          console.error("Failed to fetch current directory");
          setCurrentDirItems([]);
          setLoading(false);
          return;
        }

        const data = await response.json();
        setCurrentDirItems(data.items || []);
      } catch (error) {
        console.error("Error fetching current directory:", error);
        setCurrentDirItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentDirectory();
  }, [pathname]);

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

      return (
        <div key={item.path} style={{ marginLeft: `${level * 16}px` }}>
          <div
            className={`flex items-center py-1 rounded-md px-2 transition-colors ${
              isCurrentItem
                ? "bg-blue-100 border-l-4 border-blue-500"
                : "hover:bg-gray-100"
            }`}
          >
            {item.isDirectory ? (
              <>
                <button
                  onClick={() => toggleDirectory(item.path)}
                  className="mr-2 text-gray-500 hover:text-gray-700 flex-shrink-0"
                >
                  {expandedDirs.has(item.path) ? "▼" : "▶"}
                </button>
                <Link
                  href={item.path}
                  className={`font-medium flex-1 ${
                    isCurrentItem
                      ? "text-blue-700 font-bold"
                      : "text-gray-700 hover:text-blue-600"
                  }`}
                  style={{ wordBreak: 'keep-all' }}
                >
                  📁 {item.name}
                </Link>
                {isCurrentItem && (
                  <span className="text-blue-600 text-xs ml-2">📍</span>
                )}
              </>
            ) : (
              <>
                <div className="w-6 flex-shrink-0"></div>
                <Link
                  href={item.path}
                  className={`flex-1 ${
                    isCurrentItem
                      ? "text-blue-700 font-bold"
                      : "text-gray-600 hover:text-blue-600"
                  }`}
                  style={{ wordBreak: 'keep-all' }}
                >
                  📄 {item.name}
                </Link>
                {isCurrentItem && (
                  <span className="text-blue-600 text-xs ml-2">📍</span>
                )}
              </>
            )}
          </div>
          {item.isDirectory && expandedDirs.has(item.path) && item.children && (
            <div>{renderDirectoryTree(item.children, level + 1)}</div>
          )}
        </div>
      );
    });
  };

  // Get current location info for display
  const getCurrentLocationInfo = () => {
    if (!pathname) return { type: "directory", name: "Root", parentPath: "" };

    const currentPath = decodeURIComponent(
      pathname.startsWith("/") ? pathname.slice(1) : pathname
    );

    if (!currentPath || currentPath === "_Index_of_Root.md") {
      return { type: "directory", name: "Root", parentPath: "" };
    }

    // Extract information from path
    const pathParts = currentPath.split("/");
    const lastPart = pathParts[pathParts.length - 1];

    // Determine if it's a directory index or file
    const isDirectoryIndex = lastPart.includes("_Index_of_");
    const type = isDirectoryIndex ? "directory" : "file";

    // Clean up the name
    const cleanName = lastPart
      .replace(/_Index_of_/g, "")
      .replace(/\.md$/, "")
      .replace(/%20/g, " ");

    // Get parent directory path for breadcrumb
    const parentPath =
      pathParts.length > 1 ? pathParts.slice(0, -1).join("/") : "";

    return {
      type,
      name: cleanName || "Current Item",
      parentPath,
      fullPath: currentPath,
    };
  };

  const locationInfo = getCurrentLocationInfo();

  // Generate breadcrumb navigation
  const getBreadcrumbs = () => {
    if (!pathname) return [];
    
    const currentPath = decodeURIComponent(pathname.startsWith('/') ? pathname.slice(1) : pathname);
    
    // If we're at root, return empty breadcrumbs
    if (!currentPath || currentPath === '_Index_of_Root.md') {
      return [];
    }
    
    const breadcrumbs = [];
    
    // Always add root link
    breadcrumbs.push({
      name: "🏠 Root",
      path: "/_Index_of_Root.md"
    });
    
    // Parse the current path to build breadcrumbs
    const pathParts = currentPath.split('/');
    
    // If current path is a file, remove the filename to get parent directories
    if (currentPath.endsWith('.md') && !currentPath.includes('_Index_of_')) {
      pathParts.pop();
    }
    
    // Build cumulative paths for each directory level
    let cumulativePath = '';
    pathParts.forEach((part, index) => {
      if (part.includes('_Index_of_')) return; // Skip index files in breadcrumbs
      
      cumulativePath = index === 0 ? part : `${cumulativePath}/${part}`;
      
      breadcrumbs.push({
        name: `📁 ${decodeURIComponent(part)}`,
        path: `/${cumulativePath}/_Index_of_${part}.md`
      });
    });
    
    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <div className="w-64 lg:w-64 bg-gray-50 border-r border-gray-200 h-full overflow-y-auto">
      <div className="p-2 sm:p-4">
        {/* Breadcrumb Navigation */}
        {breadcrumbs.length > 0 && (
          <div className="mb-4 pb-3 border-b border-gray-300">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">📍 Navigation</h3>
            <div className="space-y-1">
              {breadcrumbs.map((crumb) => (
                <Link
                  key={crumb.path}
                  href={crumb.path}
                  className="block text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                >
                  {crumb.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Current Directory Contents */}
        {currentDirItems.length > 0 && (
          <div className="mb-3">
            <h3 className="text-base font-semibold text-gray-700 mb-2">
              📁 Current Directory Files
            </h3>
            <p className="text-sm text-gray-500 mb-2">
              {locationInfo.type === "directory"
                ? "Files and subdirectories in this directory"
                : "Other files in the same directory"}
            </p>
          </div>
        )}

        <div className="space-y-1">
          {loading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, index) => (
                <div
                  key={index}
                  className="block p-2 bg-gray-50 rounded-lg animate-pulse"
                >
                  <div className="h-4 bg-gray-300 rounded mb-1"></div>
                  <div className="h-3 bg-gray-300 rounded w-20"></div>
                </div>
              ))}
            </div>
          ) : (
            renderDirectoryTree(currentDirItems)
          )}
        </div>

        {!loading && currentDirItems.length === 0 && (
          <div className="text-center py-4 text-gray-500 text-sm">
            <p>📂 No files in current directory</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default CurrentDirectoryComponent;
