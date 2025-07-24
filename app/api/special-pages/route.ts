import { NextRequest } from 'next/server';
import { createErrorResponse, createSuccessResponse } from '../../lib/api-utils';
import { getSpecialPageItems } from '../../../services/specialPagesService';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pathname = searchParams.get('path');

    if (!pathname) {
      return createErrorResponse('Path parameter is required', 400);
    }

    const specialPageItems = getSpecialPageItems(pathname);
    
    if (specialPageItems) {
      // Convert SpecialPageItem to DirectoryItem format
      const items = specialPageItems.map(item => ({
        name: item.name,
        path: item.path,
        isDirectory: item.isDirectory,
      }));

      return createSuccessResponse({ items }, {}, 300); // Cache for 5 minutes
    }

    // No special page handling needed
    return createSuccessResponse({ items: [] });

  } catch (error) {
    console.error('Error in special-pages API:', error);
    return createErrorResponse('Failed to get special pages', 500);
  }
}