"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useCache } from "../contexts/CacheContext";

export interface DirectoryItem {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: DirectoryItem[];
  modifiedAt?: string;
  isLocked?: boolean;
}

export function useCurrentDirectory() {
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());
  const [currentDirItems, setCurrentDirItems] = useState<DirectoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();
  const cache = useCache();

  // Fetch current directory contents via API
  useEffect(() => {
    if (!pathname) return;

    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
    const currentDirectory = pathname.split('/').slice(0, -1).join('/') || '/';
    const cacheKey = currentDirectory;
    
    console.log('useCurrentDirectory - pathname:', pathname); // Debug log
    console.log('useCurrentDirectory - currentDirectory:', currentDirectory); // Debug log
    console.log('useCurrentDirectory - cacheKey:', cacheKey); // Debug log
    
    // Check if we have valid cached data
    const cachedItems = cache.getDirectoryCache(cacheKey);
    console.log('useCurrentDirectory - cachedItems:', cachedItems); // Debug log
    if (cachedItems && cache.isCacheValid('directories', CACHE_DURATION, cacheKey)) {
      console.log('useCurrentDirectory - using cached data:', cachedItems); // Debug log
      setCurrentDirItems(cachedItems);
      return;
    }

    const fetchCurrentDirectory = async () => {
      setLoading(true);
      try {
        // Check for special page handling via API
        const specialResponse = await fetch(`/api/special-pages?path=${encodeURIComponent(pathname)}`);
        if (specialResponse.ok) {
          const specialData = await specialResponse.json();
          if (specialData.items && specialData.items.length > 0) {
            setCurrentDirItems(specialData.items);
            cache.setDirectoryCache(cacheKey, specialData.items);
            setLoading(false);
            return;
          }
        }
        
        // Special handling: Always fetch directory contents for _Index_ files
        // This ensures the file tree is populated even when no special pages exist

        // Call the API to get current directory contents with tree structure
        const response = await fetch(
          `/api/current-directory?path=${encodeURIComponent(pathname)}&tree=true`
        );

        if (!response.ok) {
          console.error("Failed to fetch current directory");
          setCurrentDirItems([]);
          setLoading(false);
          return;
        }

        const data = await response.json();
        console.log('Current directory response:', data); // Debug log
        const items = data.items || [];
        console.log('Setting current dir items:', items); // Debug log
        setCurrentDirItems(items);
        
        // Cache the result globally
        cache.setDirectoryCache(cacheKey, items);
      } catch (error) {
        console.error("Error fetching current directory:", error);
        setCurrentDirItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentDirectory();
  }, [pathname, cache]);

  const toggleDirectory = (path: string) => {
    const newExpanded = new Set(expandedDirs);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedDirs(newExpanded);
  };

  return {
    expandedDirs,
    currentDirItems,
    loading,
    pathname,
    toggleDirectory,
  };
}