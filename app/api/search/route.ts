import { NextRequest, NextResponse } from "next/server";
import { buildIndex, search } from "@/services/search/searchService";
import { getCurrentUser } from "@/app/lib/utils";
import { handleApiError } from "@/app/lib/api-error";
import { logger } from "@/app/lib/logger";

export const dynamic = "force-dynamic";

const ROOT_DIR = process.env.OBSIDIAN_ROOT_DIR || 'Root';
const OBSIDIAN_DIR = (process.env.REPO_PATH + `/${ROOT_DIR}`) as string;

let initialized = false;

async function ensureIndex() {
  if (!initialized) {
    logger.api.info("Building search index", { directory: OBSIDIAN_DIR });
    await buildIndex(OBSIDIAN_DIR);
    initialized = true;
    logger.api.info("Search index built successfully");
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.trim();

    if (!query) {
      logger.api.debug("Empty search query");
      return NextResponse.json({ results: [] });
    }

    await ensureIndex();
    const user = await getCurrentUser(req);
    const results = search(query, user?.role);

    logger.api.debug("Search completed", { query, resultCount: results.length });
    return NextResponse.json({ results });
  } catch (error) {
    return handleApiError(error, "Search API");
  }
}
