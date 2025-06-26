import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    // Log request info for debugging
    console.log('GET /api/popular-posts called from:', request.url);
    
    const repoPath = process.env.REPO_PATH || '';
    const popularPostsPath = path.join(repoPath, '/profile/Popular Posts.md');

    console.log('Popular Posts Path:', popularPostsPath);
    
    if (!repoPath || !fs.existsSync(popularPostsPath)) {
      return NextResponse.json({ error: 'Popular Posts file not found' }, { status: 404 });
    }

    const content = await fs.promises.readFile(popularPostsPath, 'utf8');
    const lines = content.split('\n').map(line => line.trim()).filter(line => line);
    
    const popularPosts = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check if this line contains a markdown link
      const linkMatch = line.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        const title = linkMatch[1];
        let path = linkMatch[2];
        
        // Remove "Root/" prefix if present
        if (path.startsWith('Root/')) {
          path = path.substring(5);
        }
        
        // Add leading slash if not present
        if (!path.startsWith('/')) {
          path = '/' + path;
        }
        
        // Get the next two lines as category and subcategory (safely)
        const nextLine1 = (i + 1 < lines.length) ? lines[i + 1] : null;
        const nextLine2 = (i + 2 < lines.length) ? lines[i + 2] : null;
        
        // Make sure the next lines are not markdown links
        const isNextLineLink = nextLine1 && nextLine1.match(/\[([^\]]+)\]\(([^)]+)\)/);
        const isSecondLineLink = nextLine2 && nextLine2.match(/\[([^\]]+)\]\(([^)]+)\)/);
        
        let category = 'General';
        let subcategory = undefined;
        let skipCount = 0;
        
        if (nextLine1 && !isNextLineLink) {
          category = nextLine1;
          skipCount = 1;
          
          if (nextLine2 && !isSecondLineLink) {
            subcategory = nextLine2;
            skipCount = 2;
          }
        }
        
        popularPosts.push({
          title,
          path,
          category,
          subcategory
        });
        
        console.log(`Added popular post: ${title} - ${category} - ${subcategory}`);
        
        // Skip the processed lines
        i += skipCount;
      }
    }
    
    console.log(`Total popular posts found: ${popularPosts.length}`);
    
    return NextResponse.json({ popularPosts });
  } catch (error) {
    console.error('Error reading popular posts:', error);
    return NextResponse.json({ error: 'Failed to read popular posts' }, { status: 500 });
  }
}