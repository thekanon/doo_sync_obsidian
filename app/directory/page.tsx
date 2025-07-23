'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { DirectoryBrowser } from '@/app/components/filesystem/DirectoryBrowser';
import { Breadcrumbs } from '@/app/components/Breadcrumbs';
import { logger } from '@/app/lib/logger';

export default function DirectoryPage() {
  const searchParams = useSearchParams();
  const pathParam = searchParams.get('path') || '/';
  
  const [currentPath, setCurrentPath] = useState(pathParam);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update path when URL parameter changes
  useEffect(() => {
    setCurrentPath(pathParam);
  }, [pathParam]);

  const handlePathChange = (newPath: string) => {
    setCurrentPath(newPath);
    
    // Update URL without page reload
    const url = new URL(window.location.href);
    if (newPath === '/') {
      url.searchParams.delete('path');
    } else {
      url.searchParams.set('path', newPath);
    }
    window.history.pushState({}, '', url.toString());
  };

  const handleError = (error: string) => {
    setError(error);
    logger.error('Directory page error', { error, currentPath });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Directory Browser
          </h1>
          <p className="text-gray-600">
            Browse files and directories using the new API-based system
          </p>
        </div>

        {/* Breadcrumbs */}
        <div className="mb-6">
          <Breadcrumbs currentPath={currentPath} onPathChange={handlePathChange} />
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-300 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Error loading directory
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  {error}
                </div>
                <div className="mt-3">
                  <button
                    onClick={() => setError(null)}
                    className="text-sm bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded-md"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Directory Browser Component */}
        <DirectoryBrowser
          currentPath={currentPath}
          onPathChange={handlePathChange}
          onError={handleError}
          onLoadingChange={setIsLoading}
        />

        {/* Loading Overlay */}
        {isLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 shadow-lg">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="text-gray-900">Loading directory...</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}