import fs from 'fs';
import path from 'path';
import { logger } from '@/app/lib/logger';

interface SpecialPageItem {
  name: string;
  path: string;
  isDirectory: boolean;
}

interface SpecialPageConfig {
  [key: string]: SpecialPageItem[];
}

let cachedSpecialPages: SpecialPageConfig | null = null;
let lastModified: number = 0;

/**
 * Read special pages configuration from a JSON file
 * @param filePath Path to the JSON file containing special pages config
 * @returns Special pages configuration object
 */
export function readSpecialPagesConfig(filePath?: string): SpecialPageConfig {
  const specialPagesFile = filePath || process.env.SPECIAL_PAGES_FILE || 'config/special-pages.json';
  const fullPath = path.resolve(specialPagesFile);

  try {
    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      logger.warn(`Special pages file not found: ${fullPath}, using default config`);
      return getDefaultSpecialPagesConfig();
    }

    // Check file modification time for caching
    const stats = fs.statSync(fullPath);
    const currentModified = stats.mtime.getTime();

    if (cachedSpecialPages && currentModified === lastModified) {
      return cachedSpecialPages;
    }

    // Read and parse the JSON file
    const content = fs.readFileSync(fullPath, 'utf-8');
    const config = JSON.parse(content) as SpecialPageConfig;

    // Validate the config structure
    if (typeof config !== 'object' || config === null) {
      throw new Error('Special pages config must be an object');
    }

    for (const [pagePath, items] of Object.entries(config)) {
      if (!Array.isArray(items)) {
        throw new Error(`Special page items for "${pagePath}" must be an array`);
      }
      
      for (const item of items) {
        if (!item.name || !item.path || typeof item.isDirectory !== 'boolean') {
          throw new Error(`Invalid special page item structure for "${pagePath}"`);
        }
      }
    }

    // Update cache
    cachedSpecialPages = config;
    lastModified = currentModified;

    logger.debug(`Loaded special pages config from ${fullPath}`);
    return config;

  } catch (error) {
    logger.error(`Error reading special pages config: ${error}`);
    return getDefaultSpecialPagesConfig();
  }
}

/**
 * Get default special pages configuration
 */
function getDefaultSpecialPagesConfig(): SpecialPageConfig {
  return {
    "Doo Wiki 란.md": [
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
    ]
  };
}

/**
 * Get special page items for a given pathname
 * @param pathname The current pathname
 * @returns Array of special page items or null if no special handling needed
 */
export function getSpecialPageItems(pathname: string): SpecialPageItem[] | null {
  const config = readSpecialPagesConfig();
  
  // Check if pathname matches any special page configuration
  for (const [configPath, items] of Object.entries(config)) {
    if (pathname.includes(configPath)) {
      return items;
    }
  }
  
  return null;
}

/**
 * Clear the cache (useful for testing)
 */
export function clearSpecialPagesCache(): void {
  cachedSpecialPages = null;
  lastModified = 0;
}

// Export types for use in other files
export type { SpecialPageItem, SpecialPageConfig };