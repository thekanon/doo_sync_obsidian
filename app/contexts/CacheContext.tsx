"use client";
import React, { createContext, useContext, useRef, ReactNode } from 'react';
import { RecentPost, PopularPost, LinkItem } from '../types/api';
import { DirectoryItem } from '../hooks/useCurrentDirectory';

interface SidebarData {
  recentPosts: RecentPost[];
  popularPosts: PopularPost[];
  links: LinkItem[];
  timestamp: number;
}

interface DirectoryCache {
  [key: string]: {
    items: DirectoryItem[];
    timestamp: number;
  };
}

interface CacheData {
  sidebar?: SidebarData;
  directories?: DirectoryCache;
}

interface CacheContextType {
  getCache: <T extends keyof CacheData>(key: T) => CacheData[T] | null;
  setCache: <T extends keyof CacheData>(key: T, data: CacheData[T]) => void;
  isCacheValid: (key: keyof CacheData, duration: number, subKey?: string) => boolean;
  clearCache: (key?: keyof CacheData) => void;
  getDirectoryCache: (dirKey: string) => DirectoryItem[] | null;
  setDirectoryCache: (dirKey: string, items: DirectoryItem[]) => void;
}

const CacheContext = createContext<CacheContextType | undefined>(undefined);

interface CacheProviderProps {
  children: ReactNode;
}

export function CacheProvider({ children }: CacheProviderProps) {
  const cacheRef = useRef<CacheData>({});

  const getCache = <T extends keyof CacheData>(key: T): CacheData[T] | null => {
    const cachedData = cacheRef.current[key];
    
    // Validate sidebar cache structure
    if (key === 'sidebar' && cachedData) {
      const sidebarData = cachedData as SidebarData;
      if (
        !sidebarData ||
        typeof sidebarData !== 'object' ||
        !Array.isArray(sidebarData.recentPosts) ||
        !Array.isArray(sidebarData.popularPosts) ||
        !Array.isArray(sidebarData.links)
      ) {
        // Clear corrupted cache
        delete cacheRef.current[key];
        return null;
      }
    }
    
    return cachedData || null;
  };

  const setCache = <T extends keyof CacheData>(key: T, data: CacheData[T]) => {
    cacheRef.current[key] = data;
  };

  const isCacheValid = (key: keyof CacheData, duration: number, subKey?: string): boolean => {
    const cached = cacheRef.current[key];
    if (!cached) return false;
    
    // For sidebar data, check timestamp
    if (key === 'sidebar' && 'timestamp' in cached) {
      return Date.now() - (cached as SidebarData).timestamp < duration;
    }
    
    // For directories data, check timestamp of specific directory
    if (key === 'directories' && subKey) {
      const dirCache = cached as DirectoryCache;
      const dirData = dirCache[subKey];
      if (dirData && 'timestamp' in dirData) {
        return Date.now() - dirData.timestamp < duration;
      }
    }
    
    return false;
  };

  const clearCache = (key?: keyof CacheData) => {
    if (key) {
      delete cacheRef.current[key];
    } else {
      cacheRef.current = {};
    }
  };

  const getDirectoryCache = (dirKey: string): DirectoryItem[] | null => {
    const directories = cacheRef.current.directories;
    return directories?.[dirKey]?.items || null;
  };

  const setDirectoryCache = (dirKey: string, items: DirectoryItem[]) => {
    if (!cacheRef.current.directories) {
      cacheRef.current.directories = {};
    }
    cacheRef.current.directories[dirKey] = {
      items,
      timestamp: Date.now()
    };
  };

  const value: CacheContextType = {
    getCache,
    setCache,
    isCacheValid,
    clearCache,
    getDirectoryCache,
    setDirectoryCache
  };

  return (
    <CacheContext.Provider value={value}>
      {children}
    </CacheContext.Provider>
  );
}

export function useCache() {
  const context = useContext(CacheContext);
  if (context === undefined) {
    throw new Error('useCache must be used within a CacheProvider');
  }
  return context;
}