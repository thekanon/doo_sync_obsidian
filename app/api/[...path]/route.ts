import fs from "fs/promises";
import path from "path";
import { marked } from "marked";
import { NextRequest, NextResponse } from "next/server";

const OBSIDIAN_DIR = "/home/leedo/바탕화면/source/DooSyncBrain/DooBrain/Root";
const OBSIDIAN_LINK_REGEX = /\[([^\]]+)\]\(Root/g;
const REMARK_REGEX = /%%[^%]+%%/g;
const LAST_PULL_TIME_FILE = "/tmp/last_pull_time";

// Types
type Params = {
  path: string[];
};

interface ApiResponse {
  content?: string;
  error?: string;
}

const convertObsidianLinks = (content: string): string => {
  return content.replace(OBSIDIAN_LINK_REGEX, "[$1](");
};

const removeRemark = (content: string): string => {
  return content.replace(REMARK_REGEX, "");
};

const processContent = async (content: string): Promise<string> => {
  const convertedContent = convertObsidianLinks(content);
  const removedRemarkContent = removeRemark(convertedContent);
  const result = await marked(removedRemarkContent);
  return result;
};

const readAndProcessFile = async (filePath: string): Promise<string> => {
  const content = await fs.readFile(filePath, "utf8");
  return processContent(content);
};

async function getLastPullTime(): Promise<number> {
  try {
    const timestamp = await fs.readFile(LAST_PULL_TIME_FILE, "utf8");
    return parseInt(timestamp.trim(), 10);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      console.log("Last pull time file not found, assuming first run");
      return 0;
    }
    console.error("Error reading last pull time:", error);
    return 0;
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Params }
): Promise<NextResponse<ApiResponse>> {
  try {
    const { path: notePath } = context.params;
    const fullPath = path.join(OBSIDIAN_DIR, ...notePath);

    // Check if the file has been modified since the last git pull
    const lastPullTime = await getLastPullTime();
    const stats = await fs.stat(fullPath);

    if (stats.mtime.getTime() > lastPullTime) {
      console.log("File modified since last pull, serving latest content");
    } else {
      console.log(
        "File not modified since last pull, serving cached content if available"
      );
      // Here you could implement caching logic if needed
    }

    const htmlContent = await readAndProcessFile(fullPath);
    return NextResponse.json({ content: htmlContent });
  } catch (error) {
    console.error("Error processing note:", error);

    if (
      error instanceof Error &&
      (error as NodeJS.ErrnoException).code === "ENOENT"
    ) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
