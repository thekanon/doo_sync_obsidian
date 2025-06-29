import { MetadataRoute } from 'next'
import fs from 'fs/promises'
import path from 'path'
import { pagePermissions } from './types/pagePermissions'
import { getHost } from './lib/utils'  // getHost import 추가

const ROOT_DIR = process.env.OBSIDIAN_ROOT_DIR || 'Root';
const OBSIDIAN_DIR = (process.env.REPO_PATH + `/${ROOT_DIR}`) as string;
const DAILY_FREQUENCY = 'daily' as const;
const baseUrl = getHost() as string;



function isPathPrivate(urlPath: string): boolean {    
    // /99. 일기/* 경로가 있다면, /99.일기/* 형태로도 매칭되어야 함
    const normalizedPath = urlPath.replace(/\s+/g, ''); // 공백 제거
  
    return pagePermissions.some(permission => {
      if (permission.isPublic || !permission.allowedRoles.length) {
        return false;
      }
  
      // permission.path에서도 공백 제거
      const normalizedPermissionPath = permission.path.replace(/\s+/g, '');
      
      const pathPattern = normalizedPermissionPath
        .replace(/\*/g, '.*')
        .replace(/\//g, '\\/');
      
      const regex = new RegExp(`^${pathPattern}$`);
      const isPrivate = regex.test(normalizedPath);
  
      return isPrivate;
    });
  }

function isPathPublic(filePath: string): boolean {
    const urlPath = '/' + filePath.replace(/\.md$/, '');

    // 먼저 비공개 여부 확인
    const isPrivate = isPathPrivate(urlPath);

    // 비공개면 false, 아니면 true 반환
    return !isPrivate;
}

async function getAllFilePaths(dir: string, baseDir: string = dir): Promise<string[]> {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const files = await Promise.all(
      entries.map(async (entry) => {
        const res = path.resolve(dir, entry.name);
        if (entry.isDirectory()) {
          return getAllFilePaths(res, baseDir);
        } else if (entry.name.endsWith('.md')) {
          const relativePath = path
            .relative(baseDir, res)
            .split(path.sep)
            .join('/');
          
          // _Index_of_ 파일 처리 수정
          if (entry.name === `_Index_of_${ROOT_DIR}.md` || !entry.name.includes('_Index_of_')) {
            if (isPathPublic(relativePath)) {
              return relativePath;
            }
          }
        }
        return [];
      })
    );

    return files.flat().filter(Boolean);
  } catch (error) {
    console.error('Error in getAllFilePaths:', error);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const paths = await getAllFilePaths(OBSIDIAN_DIR);

    const routes = [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: DAILY_FREQUENCY,
        priority: 1,
      }
    ];

    for (const filePath of paths) {
      try {
        const fullPath = path.join(OBSIDIAN_DIR, filePath);
        const stats = await fs.stat(fullPath);
        
        const route = {
          url: `${baseUrl}/${encodeURI(filePath.replace(/\.md$/, ''))}`,
          lastModified: stats.mtime,
          changeFrequency: DAILY_FREQUENCY,
          priority: 0.8,
        };
        
        routes.push(route);
      } catch (error) {
        console.error(`Error processing file ${filePath}:`, error);
      }
    }

    return routes;
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: DAILY_FREQUENCY,
        priority: 1,
      },
    ];
  }
}