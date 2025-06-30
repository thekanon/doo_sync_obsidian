import fs from 'fs';
import path from 'path';
import { logger } from '@/app/lib/logger';

let cachedPrivateFolders: string[] | null = null;
let lastModified: number = 0;

/**
 * Read private folders from a markdown file
 * @param filePath Path to the markdown file containing private folders
 * @returns Array of private folder paths
 */
export function readPrivateFolders(filePath?: string): string[] {
  const privateFoldersFile = filePath || process.env.PRIVATE_FOLDERS_FILE || 'config/private-folders.md';
  const fullPath = path.resolve(privateFoldersFile);

  try {
    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      logger.warn(`Private folders file not found: ${fullPath}, using default list`);
      return getDefaultPrivateFolders();
    }

    // Check file modification time for caching
    const stats = fs.statSync(fullPath);
    const currentModified = stats.mtime.getTime();

    if (cachedPrivateFolders && currentModified === lastModified) {
      return cachedPrivateFolders;
    }

    // Read and parse the markdown file
    const content = fs.readFileSync(fullPath, 'utf-8');
    const folders = parsePrivateFoldersFromMarkdown(content);

    // Update cache
    cachedPrivateFolders = folders;
    lastModified = currentModified;

    logger.debug(`Loaded ${folders.length} private folders from ${fullPath}`);
    return folders;

  } catch (error) {
    logger.error(`Error reading private folders file: ${error}`);
    return getDefaultPrivateFolders();
  }
}

/**
 * Parse private folders from markdown content
 * @param content Markdown content
 * @returns Array of private folder paths
 */
function parsePrivateFoldersFromMarkdown(content: string): string[] {
  const folders: string[] = [];
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//')) {
      continue;
    }

    // Parse list items (- folder or * folder)
    const listMatch = trimmed.match(/^[-*]\s*(.+)$/);
    if (listMatch) {
      const folder = listMatch[1].trim();
      if (folder) {
        // Ensure folder starts with /
        const normalizedFolder = folder.startsWith('/') ? folder : `/${folder}`;
        folders.push(normalizedFolder);
      }
    }
    
    // Parse direct folder paths (lines that start with /)
    else if (trimmed.startsWith('/')) {
      folders.push(trimmed);
    }
  }

  return folders;
}

/**
 * Get default private folders if config file is not available
 */
function getDefaultPrivateFolders(): string[] {
  return [
    '/1. 일지',
    '/7. 생각정리',
    '/8. 루틴', 
    '/97. 보안 폴더',
    '/98. 미분류',
    '/99. 일기'
  ];
}

/**
 * Check if a path is a private folder
 * @param pathToCheck Path to check
 * @returns True if the path is private
 */
export function isPrivateFolder(pathToCheck: string): boolean {
  const privateFolders = readPrivateFolders();
  return privateFolders.some(folder => pathToCheck.startsWith(folder));
}

/**
 * Clear the cache (useful for testing)
 */
export function clearPrivateFoldersCache(): void {
  cachedPrivateFolders = null;
  lastModified = 0;
}