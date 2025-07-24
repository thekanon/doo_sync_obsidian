"use client";
import { useCurrentDirectory } from "@/app/hooks/useCurrentDirectory";
import { getCurrentLocationInfo } from "@/app/utils/pathUtils";
import Breadcrumbs from "@/app/components/navigation/Breadcrumbs";
import DirectoryTree from "@/app/components/directory/DirectoryTree";
import DirectoryLoader from "@/app/components/directory/DirectoryLoader";

function CurrentDirectoryComponent() {
  console.log('CurrentDirectory component mounted!'); // Debug log
  
  const {
    expandedDirs,
    currentDirItems,
    loading,
    pathname,
    toggleDirectory,
  } = useCurrentDirectory();

  const locationInfo = getCurrentLocationInfo(pathname);

  return (
    <div className="w-64 lg:w-64 bg-gray-50 border-r border-gray-200 h-full overflow-y-auto">
      <div className="p-2 sm:p-4">
        {/* Breadcrumb Navigation */}
        <Breadcrumbs pathname={pathname} />

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

        {loading ? (
          <DirectoryLoader />
        ) : (
          <DirectoryTree
            items={currentDirItems}
            expandedDirs={expandedDirs}
            pathname={pathname}
            onToggleDirectory={toggleDirectory}
          />
        )}

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