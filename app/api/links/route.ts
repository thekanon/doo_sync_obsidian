import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { logger } from '@/app/lib/logger';

export async function GET(request: NextRequest) {
  try {
    // Log request info for debugging
    logger.debug('GET /api/links called from:', request.url);
    
    const repoPath = process.env.REPO_PATH || '';
    const linksPath = path.join(repoPath, '/profile/Link.md');
    
    if (!repoPath || !fs.existsSync(linksPath)) {
      return NextResponse.json({ error: 'Links file not found' }, { status: 404 });
    }

    const content = await fs.promises.readFile(linksPath, 'utf8');
    const lines = content.split('\n');
    
    const links = [];
    
    for (let i = 0; i < lines.length; i++) {
      const titleLine = lines[i];
      const urlLine = lines[i + 1];
      
      // Check if current line is a title (not starting with tab) and next line is URL (starting with tab)
      if (titleLine && urlLine && !titleLine.startsWith('\t') && urlLine.startsWith('\t')) {
        const title = titleLine.trim();
        const url = urlLine.trim();
        
        // Basic URL validation
        if (url.startsWith('http://') || url.startsWith('https://')) {
          links.push({
            title,
            url
          });
        }
        
        // Skip the URL line in the next iteration
        i++;
      }
    }
    
    return NextResponse.json({ 
      success: true,
      data: links 
    });
  } catch (error) {
    console.error('Error reading links:', error);
    return NextResponse.json({ error: 'Failed to read links' }, { status: 500 });
  }
}