import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getCurrentUser, hasPermission } from '../../lib/utils';
import { UserRole } from '../../types/user';

interface DirectoryItem {
  name: string;
  path: string;
  isDirectory: boolean;
  modifiedAt: string;
  isLocked?: boolean;
}

export async function GET(request: NextRequest) {
  try {
    // Get the current path from query parameters
    const { searchParams } = new URL(request.url);
    const currentPath = searchParams.get('path') || '';
    
    const repoPath = process.env.REPO_PATH || '';
    const rootDirName = process.env.OBSIDIAN_ROOT_DIR || 'Root';
    const rootDir = path.join(repoPath, rootDirName);
    
    if (!repoPath || !fs.existsSync(rootDir)) {
      return NextResponse.json({ error: 'Root directory not found' }, { status: 404 });
    }

    // Get current user to check permissions
    const user = await getCurrentUser(request);
    const userRole = user?.role || UserRole.ANONYMOUS;

    // Determine the directory to scan based on current path
    let directoryToScan = rootDir;
    let relativePath = '';
    
    if (currentPath && currentPath !== '/' && currentPath !== `_Index_of_${rootDirName}.md`) {
      // Clean the path - remove leading slash and decode URL
      const cleanPath = decodeURIComponent(currentPath.startsWith('/') ? currentPath.slice(1) : currentPath);
      
      // If it's a file, get its parent directory
      if (cleanPath.endsWith('.md')) {
        const fileParts = cleanPath.split('/');
        fileParts.pop(); // Remove the file name
        relativePath = fileParts.join('/');
      } else {
        relativePath = cleanPath;
      }
      
      // If relativePath exists, update directoryToScan
      if (relativePath) {
        directoryToScan = path.join(rootDir, relativePath);
      }
    }
    
    if (!fs.existsSync(directoryToScan)) {
      return NextResponse.json({ error: 'Directory not found' }, { status: 404 });
    }

    // Read the directory contents
    const entries = await fs.promises.readdir(directoryToScan, { withFileTypes: true });
    const items: DirectoryItem[] = [];
    
    for (const entry of entries) {
      // Skip hidden files and _Index_of_ files
      if (entry.name.startsWith('.') || entry.name.includes('_Index_of_')) continue;
      
      const fullPath = path.join(directoryToScan, entry.name);
      const itemRelativePath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
      const itemPathForPermission = `/${itemRelativePath}`;
      
      // Check permissions - now include locked items instead of filtering them out
      const hasAccess = hasPermission(userRole, itemPathForPermission);
      
      
      // Get file stats
      const stats = await fs.promises.stat(fullPath);
      
      if (entry.isDirectory()) {
        // For directories, create path to their index file
        const indexPath = `${itemPathForPermission}/_Index_of_${entry.name}.md`;
        items.push({
          name: entry.name,
          path: indexPath,
          isDirectory: true,
          modifiedAt: stats.mtime.toISOString(),
          isLocked: !hasAccess
        });
      } else if (entry.name.endsWith('.md')) {
        items.push({
          name: entry.name.replace('.md', ''),
          path: itemPathForPermission,
          isDirectory: false,
          modifiedAt: stats.mtime.toISOString(),
          isLocked: !hasAccess
        });
      }
    }
    
    // Sort items: directories first, then files, then by name
    items.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    });
    
    return NextResponse.json({ 
      items,
      currentPath: relativePath || rootDirName,
      totalCount: items.length
    });
  } catch (error) {
    console.error('Error getting current directory:', error);
    return NextResponse.json({ error: 'Failed to get current directory' }, { status: 500 });
  }
}