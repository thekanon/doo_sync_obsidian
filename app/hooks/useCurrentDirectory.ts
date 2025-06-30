"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { getSpecialPageItems, type SpecialPageItem } from "../../services/specialPagesService";

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

  // Fetch current directory contents via API
  useEffect(() => {
    if (!pathname) return;

    const fetchCurrentDirectory = async () => {
      setLoading(true);
      try {
        // Check for special page handling
        const specialPageItems = getSpecialPageItems(pathname);
        if (specialPageItems) {
          // Convert SpecialPageItem to DirectoryItem
          const directoryItems: DirectoryItem[] = specialPageItems.map(item => ({
            name: item.name,
            path: item.path,
            isDirectory: item.isDirectory,
          }));
          setCurrentDirItems(directoryItems);
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

  return {
    expandedDirs,
    currentDirItems,
    loading,
    pathname,
    toggleDirectory,
  };
}