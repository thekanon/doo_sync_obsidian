import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { logger } from '@/app/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // Set cache headers
    const headers = {
      'Cache-Control': 's-maxage=300, stale-while-revalidate=600',
      'Content-Type': 'application/json',
    };
    
    // Log request info for debugging
    logger.debug('GET /api/links called from:', request.url);
    
    const repoPath = process.env.REPO_PATH || '';
    const linksPath = path.join(repoPath, '/profile/Link.md');
    
    if (!repoPath || !fs.existsSync(linksPath)) {
      return NextResponse.json({ error: 'Links file not found' }, { 
      status: 404,
      headers: { 'Cache-Control': 'no-cache' }
    });
    }

    const content = await fs.promises.readFile(linksPath, 'utf8');
    const lines = content.split('\n').filter(line => line.trim());
    
    const links = [];
    
    for (let i = 0; i < lines.length; i += 2) {
      const titleLine = lines[i];
      const urlLine = lines[i + 1];
      
      if (titleLine && urlLine) {
        const title = titleLine.trim();
        const url = urlLine.trim();
        
        // Basic URL validation
        if (url.startsWith('http://') || url.startsWith('https://')) {
          links.push({
            title,
            url
          });
        }
      }
    }
    
    return NextResponse.json({ 
      success: true,
      data: links 
    }, { headers });
  } catch (error) {
    console.error('Error reading links:', error);
    return NextResponse.json({ error: 'Failed to read links' }, { 
      status: 500,
      headers: { 'Cache-Control': 'no-cache' }
    });
  }
}