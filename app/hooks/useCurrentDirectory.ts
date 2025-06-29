"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

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

  return {
    expandedDirs,
    currentDirItems,
    loading,
    pathname,
    toggleDirectory,
  };
}