'use client';

import { useState, useEffect, useCallback } from 'react';
import { FileInfo } from '@/app/api/v1/filesystem/files/route';
import { TreeNode } from '@/app/api/v1/filesystem/tree/route';
import { FilesystemAPI } from '@/app/lib/api/FilesystemAPI';
import { FileList } from './FileList';
import { DirectoryTree } from './DirectoryTree';
import { SearchBar } from './SearchBar';
import { ViewToggle } from './ViewToggle';

interface DirectoryBrowserProps {
  currentPath: string;
  onPathChange: (path: string) => void;
  onError: (error: string) => void;
  onLoadingChange: (loading: boolean) => void;
}

type ViewMode = 'list' | 'tree' | 'grid';

export function DirectoryBrowser({
  currentPath,
  onPathChange,
  onError,
  onLoadingChange,
}: DirectoryBrowserProps) {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [tree, setTree] = useState<TreeNode | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [totalFiles, setTotalFiles] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage] = useState(50);
  const [sortBy, setSortBy] = useState<'name' | 'modified' | 'created' | 'size' | 'type'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showHidden, setShowHidden] = useState(false);
  const [selectedFileType, setSelectedFileType] = useState<'all' | 'file' | 'directory'>('all');

  const filesystemAPI = new FilesystemAPI();

  // Load files for list/grid view
  const loadFiles = useCallback(async () => {
    try {
      onLoadingChange(true);
      
      const response = await filesystemAPI.getFiles({
        path: currentPath,
        type: selectedFileType,
        sort_by: sortBy,
        sort_order: sortOrder,
        page: currentPage,
        per_page: perPage,
        include_metadata: true,
        include_permissions: false,
      });

      setFiles(response.data);
      setTotalFiles(response.pagination.total_items);
      
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Failed to load files');
    } finally {
      onLoadingChange(false);
    }
  }, [currentPath, selectedFileType, sortBy, sortOrder, currentPage, perPage, onError, onLoadingChange, filesystemAPI]);

  // Load tree for tree view
  const loadTree = useCallback(async () => {
    try {
      onLoadingChange(true);
      
      const response = await filesystemAPI.getTree({
        path: currentPath,
        max_depth: 3,
        lazy_load: true,
        include_files: false,
        include_counts: true,
      });

      setTree(response.tree);
      
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Failed to load directory tree');
    } finally {
      onLoadingChange(false);
    }
  }, [currentPath, onError, onLoadingChange, filesystemAPI]);

  // Load data when dependencies change
  useEffect(() => {
    if (viewMode === 'tree') {
      loadTree();
    } else {
      loadFiles();
    }
  }, [viewMode, loadFiles, loadTree]);

  // Reset page when path changes
  useEffect(() => {
    setCurrentPage(1);
  }, [currentPath, selectedFileType, sortBy, sortOrder]);

  const handleFileClick = (file: FileInfo) => {
    if (file.type === 'directory') {
      onPathChange(file.path);
    } else {
      // Navigate to file view
      window.location.href = `/file?path=${encodeURIComponent(file.path)}`;
    }
  };

  const handleTreeNodeClick = (node: TreeNode) => {
    if (node.type === 'directory') {
      onPathChange(node.path);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      // Reload normal view
      if (viewMode === 'tree') {
        loadTree();
      } else {
        loadFiles();
      }
      return;
    }

    try {
      onLoadingChange(true);
      
      const response = await filesystemAPI.search({
        q: query,
        path: currentPath,
        type: selectedFileType,
        search_in: 'both',
        page: 1,
        per_page: perPage,
      });

      setFiles(response.results.map(result => result.item));
      setTotalFiles(response.pagination.total_items);
      
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Search failed');
    } finally {
      onLoadingChange(false);
    }
  };

  const handleSortChange = (newSortBy: typeof sortBy, newSortOrder: typeof sortOrder) => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const totalPages = Math.ceil(totalFiles / perPage);

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Toolbar */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Search and filters */}
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <div className="flex-1 max-w-md">
              <SearchBar
                query={searchQuery}
                onSearch={handleSearch}
                placeholder="Search files and directories..."
              />
            </div>
            
            <div className="flex gap-2">
              {/* File type filter */}
              <select
                value={selectedFileType}
                onChange={(e) => setSelectedFileType(e.target.value as typeof selectedFileType)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All</option>
                <option value="file">Files</option>
                <option value="directory">Directories</option>
              </select>

              {/* Show hidden toggle - only for list/grid view */}
              {viewMode !== 'tree' && (
                <button
                  onClick={() => setShowHidden(!showHidden)}
                  className={`px-3 py-2 text-sm rounded-md border ${
                    showHidden
                      ? 'bg-blue-50 border-blue-300 text-blue-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {showHidden ? 'Hide Hidden' : 'Show Hidden'}
                </button>
              )}
            </div>
          </div>

          {/* View toggle */}
          <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {viewMode === 'tree' ? (
          <DirectoryTree
            tree={tree}
            onNodeClick={handleTreeNodeClick}
            currentPath={currentPath}
          />
        ) : (
          <FileList
            files={files}
            viewMode={viewMode}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onFileClick={handleFileClick}
            onSortChange={handleSortChange}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            showHidden={showHidden}
          />
        )}

        {/* Empty state */}
        {((viewMode === 'tree' && !tree) || (viewMode !== 'tree' && files.length === 0)) && !searchQuery && (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No files found</h3>
            <p className="mt-1 text-sm text-gray-500">
              This directory appears to be empty or you don't have permission to view its contents.
            </p>
          </div>
        )}

        {/* Search empty state */}
        {files.length === 0 && searchQuery && (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No results found</h3>
            <p className="mt-1 text-sm text-gray-500">
              No files or directories match your search for "{searchQuery}".
            </p>
            <button
              onClick={() => handleSearch('')}
              className="mt-3 text-sm text-blue-600 hover:text-blue-500"
            >
              Clear search
            </button>
          </div>
        )}
      </div>
    </div>
  );
}