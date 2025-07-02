"use client";
import { useEffect } from 'react';
import { useCache } from '../contexts/CacheContext';

const PRELOAD_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

export function usePreloader() {
  const { isCacheValid, setCache } = useCache();

  useEffect(() => {
    // Skip if data is already cached and valid
    if (isCacheValid('sidebar', PRELOAD_CACHE_DURATION)) {
      return;
    }

    // Preload critical sidebar data immediately on app mount
    const preloadCriticalData = async () => {
      try {
        const [recentResponse, popularResponse, linksResponse] = await Promise.all([
          fetch('/api/recent-posts'),
          fetch('/api/popular-posts'),
          fetch('/api/links')
        ]);

        if (recentResponse.ok && popularResponse.ok && linksResponse.ok) {
          const [recentPosts, popularPosts, links] = await Promise.all([
            recentResponse.json(),
            popularResponse.json(),
            linksResponse.json()
          ]);

          // Cache the preloaded data
          setCache('sidebar', {
            recentPosts,
            popularPosts,
            links,
            timestamp: Date.now()
          });
        }
      } catch (error) {
        console.debug('Preload failed, will fetch on demand:', error);
      }
    };

    // Run preloading in the background
    preloadCriticalData();
  }, [isCacheValid, setCache]);
}