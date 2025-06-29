import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getCurrentUser } from '../../lib/utils';
import { hasPermission } from '../../lib/utils';
import { UserRole } from '../../types/user';
import { createErrorResponse, createSuccessResponse, checkRateLimit } from '../../lib/api-utils';
import { getEnvVar } from '../../lib/env-validation';

interface FileInfo {
  name: string;
  path: string;
  modifiedAt: Date;
  category: string;
}

async function getRecentMarkdownFiles(
  dir: string, 
  relativePath: string = "", 
  maxFiles: number = 5,
  maxDepth: number = 3,
  currentDepth: number = 0
): Promise<FileInfo[]> {
  if (currentDepth >= maxDepth) return [];
  const files: FileInfo[] = [];
  
  try {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue;
      
      const fullPath = path.join(dir, entry.name);
      const itemPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
      
      // Skip obviously private folders early
      const pathToCheck = `/${itemPath}`;
      if (isPrivateFolder(pathToCheck)) {
        continue;
      }
      
      if (entry.isDirectory()) {
        const subFiles = await getRecentMarkdownFiles(fullPath, itemPath, maxFiles * 2, maxDepth, currentDepth + 1);
        files.push(...subFiles);
      } else if (entry.name.endsWith('.md') && !entry.name.includes('_Index_of_')) {
        const stats = await fs.promises.stat(fullPath);
        const category = relativePath.split('/')[0] || 'General';
        
        files.push({
          name: entry.name.replace('.md', ''),
          path: `/${itemPath}`,
          modifiedAt: stats.mtime,
          category: category.replace(/^\d+\.\s*/, '') // Remove number prefixes like "2. "
        });
      }
    }
  } catch (error) {
    console.error('Error reading directory:', error);
  }
  
  return files.sort((a, b) => b.modifiedAt.getTime() - a.modifiedAt.getTime()).slice(0, maxFiles);
}

function isPrivateFolder(path: string): boolean {
  const privateFolders = [
    '/1. 일지',
    '/7. 생각정리',
    '/8. 루틴', 
    '/97. 보안 폴더',
    '/98. 미분류',
    '/99. 일기'
  ];
  
  return privateFolders.some(folder => path.startsWith(folder));
}

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const clientIp = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(clientIp, 50, 60000)) {
      return createErrorResponse('Too many requests', 429);
    }

    const repoPath = getEnvVar('REPO_PATH');
    const rootDirName = process.env.OBSIDIAN_ROOT_DIR || 'Root';
    // Ensure we only scan within the root directory for security
    const rootDir = path.join(repoPath, rootDirName);
    
    if (!fs.existsSync(rootDir)) {
      return createErrorResponse('Root directory not found', 404);
    }

    // Get current user to check permissions
    const user = await getCurrentUser(request);
    const userRole = user?.role || UserRole.ANONYMOUS;

    const recentFiles = await getRecentMarkdownFiles(rootDir, "", 100); // Get many more files to ensure 5+ after filtering
    
    // Filter files based on user permissions - STRICT permission checking only
    const allowedFiles = recentFiles.filter(file => {
      // file.path should be relative to Root, so we need to add leading slash for permission check
      const pathForPermissionCheck = file.path.startsWith('/') ? file.path : '/' + file.path;
      const hasAccess = hasPermission(userRole, pathForPermissionCheck);
      return hasAccess;
    });
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`Found ${allowedFiles.length} allowed files out of ${recentFiles.length} total files for user role: ${userRole}`);
    }
    
    const recentPosts = allowedFiles.slice(0, 5).map(file => ({
      title: file.name,
      path: file.path,
      category: file.category,
      date: file.modifiedAt.toISOString().split('T')[0] // Format as YYYY-MM-DD
    }));
    
    return createSuccessResponse(recentPosts, {
      total: recentPosts.length
    }, 300); // Cache for 5 minutes
  } catch (error) {
    return createErrorResponse(error, 500, 'Failed to get recent posts');
  }
}