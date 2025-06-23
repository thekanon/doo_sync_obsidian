import { NextRequest, NextResponse } from "next/server";
import { buildIndex, search } from "@/services/search/searchService";

export const dynamic = "force-dynamic";

const OBSIDIAN_DIR = (process.env.REPO_PATH + "/Root") as string;

let initialized = false;

async function ensureIndex() {
  if (!initialized) {
    await buildIndex(OBSIDIAN_DIR);
    initialized = true;
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.trim();

    if (!query) {
      return NextResponse.json({ results: [] });
    }

    await ensureIndex();
    const results = search(query);

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
