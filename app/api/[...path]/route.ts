import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { exec, ExecException } from "child_process";
import { marked } from "marked";
import { NextRequest, NextResponse } from "next/server";
import { buildIndex } from "@/services/search/searchService";
import { logger } from "@/app/lib/logger";

// 커스텀 execAsync 함수 정의
const execAsync = (
  command: string,
  options?: { cwd?: string }
): Promise<{ stdout: string; stderr: string; exitCode: number | null }> => {
  return new Promise((resolve) => {
    exec(
      command,
      options,
      (
        error: ExecException | null,
        stdout: string | Buffer,
        stderr: string | Buffer
      ) => {
        resolve({
          stdout: stdout.toString(),
          stderr: stderr.toString(),
          exitCode: error ? error.code || 1 : 0,
        });
      }
    );
  });
};

marked.setOptions({
  gfm: true, // GitHub Flavored Markdown 활성화
  breaks: true, // 줄바꿈 시 <br> 태그를 추가하도록 설정
});

const ROOT_DIR = process.env.OBSIDIAN_ROOT_DIR || 'Root';
const OBSIDIAN_DIR = (process.env.REPO_PATH + `/${ROOT_DIR}`) as string;
const OBSIDIAN_LINK_REGEX = new RegExp(`\\[([^\\]]+)\\]\\(${ROOT_DIR}`, 'g');
const OBSIDIAN_INDEX_REGEX = /\[\[([^\|]+)\|([^\]]+)\]\]/g;

const REMARK_REGEX = /%%[^%]+%%/g;
const TAG_REGEX = /---[\s\S]*?---\s*/;

// Constants
const GITHUB_WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET as string;
const REPO_PATH = process.env.REPO_PATH as string;
const LAST_PULL_TIME_FILE = path.join(REPO_PATH, ".last_pull_time");

// Types
type Params = {
  path: string[];
};

interface ApiResponse {
  content?: string;
  error?: string;
}

const convertObsidianIndexLinks = (content: string): string => {
  return content.replace(OBSIDIAN_INDEX_REGEX, (_, link, text) => {
    const formattedLink = link.replace(/ /g, "%20");
    const removeRoot = formattedLink.replace(`${ROOT_DIR}/`, "");
    return `[${text}](/${removeRoot}.md)`;
  });
};

const convertObsidianLinks = (content: string): string => {
  return content.replace(OBSIDIAN_LINK_REGEX, "[$1](");
};

const removeRemark = (content: string): string => {
  return content.replace(REMARK_REGEX, "");
};

function removeTagsSection(content: string): string {
  // 정규식을 사용하여 ---로 둘러싸인 tags 섹션을 제거
  const result = content.replace(TAG_REGEX, "");
  return result;
}

const processContent = async (content: string): Promise<string> => {
  // console.log("🐼st");
  // console.log(content);
  const convertedIndexLinks = convertObsidianIndexLinks(content);
  // console.log("🐼en");
  // console.log(convertedIndexLinks);

  const convertedContent = convertObsidianLinks(convertedIndexLinks);
  const removedRemarkContent = removeRemark(convertedContent);
  const removedTagsContent = removeTagsSection(removedRemarkContent);
  const result = await marked(removedTagsContent);
  return result;
};

const readDirectoryFiles = async (dirPath: string) => {
  const files = await fs.readdir(dirPath);
  const fileStats = await Promise.all(
    files.map(async (file) => {
      const fullPath = path.join(dirPath, file);
      const stats = await fs.stat(fullPath);
      return {
        name: file,
        updatedAt: stats.mtime.toISOString(),
        createdAt: stats.birthtime.toISOString(),
        isDirectory: stats.isDirectory(),
      };
    })
  );
  return fileStats;
};

const readAndProcessFile = async (
  filePath: string
): Promise<{
  content: string;
  createdAt: string;
  updatedAt: string;
  directoryFiles?: Array<{
    name: string;
    updatedAt: string;
    createdAt: string;
    isDirectory: boolean;
  }>;
}> => {
  const content = await fs.readFile(filePath, "utf8");
  const stats = await fs.stat(filePath);

  const fileName = path.basename(filePath);
  const isIndexFile = fileName.includes("_Index_of_");

  let directoryFiles;
  if (isIndexFile) {
    const dirPath = path.dirname(filePath);
    directoryFiles = await readDirectoryFiles(dirPath);
    logger.debug("Directory files:", directoryFiles);
  }

  const processedContent = await processContent(content);

  return {
    content: processedContent,
    createdAt: stats.birthtime.toISOString(),
    updatedAt: stats.mtime.toISOString(),
    directoryFiles: directoryFiles,
  };
};

export async function GET(
  request: NextRequest,
  { params }: { params: Params }
): Promise<NextResponse<ApiResponse>> {
  try {
    const { path: notePath } = params;
    const fullPath = path.join(OBSIDIAN_DIR, ...notePath);

    const {
      content: htmlContent,
      createdAt,
      updatedAt,
      directoryFiles,
    } = await readAndProcessFile(fullPath);

    return NextResponse.json({
      content: htmlContent,
      createdAt,
      updatedAt,
      directoryFiles,
    });
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

// github webhook으로 push가 발생하면 이곳에서 git pull을 실행하고 last pull time을 업데이트
const verifyGithubWebhook = (req: NextRequest, body: string): boolean => {
  const signature = req.headers.get("x-hub-signature-256");
  if (!signature) {
    console.error("No signature provided");
    return false;
  }

  const hmac = crypto.createHmac("sha256", GITHUB_WEBHOOK_SECRET);
  const digest = "sha256=" + hmac.update(body).digest("hex");
  
  const sigBuffer = new Uint8Array(Buffer.from(signature, 'utf8'));
  const digestBuffer = new Uint8Array(Buffer.from(digest, 'utf8'));
  
  return crypto.timingSafeEqual(sigBuffer, digestBuffer);
};

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse>> {
  try {
    const body = await request.text();

    if (!verifyGithubWebhook(request, body)) {
      console.error("Invalid webhook signature");
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 403 }
      );
    }

    logger.debug("Pulling latest changes from git repository");
    const event = request.headers.get("x-github-event");
    logger.debug("Event:", event);
    if (event !== "push") {
      logger.debug("Webhook action is not push, skipping git pull");
      return NextResponse.json(
        { content: "Webhook processed successfully" },
        { status: 200 }
      );
    }

    const { stdout, stderr, exitCode } = await execAsync(
      "git pull origin main",
      {
        cwd: REPO_PATH,
      }
    );

    logger.debug("Git pull output:", stdout);
    if (stderr) logger.debug("Git pull :", stderr);

    if (exitCode !== 0) {
      console.error(`Git pull failed with exit code ${exitCode}`);
      return NextResponse.json(
        { error: "Failed to pull latest changes" },
        { status: 500 }
      );
    }

    await fs.writeFile(LAST_PULL_TIME_FILE, Date.now().toString());

    // Update search index with new content
    await buildIndex(OBSIDIAN_DIR);

    return NextResponse.json(
      { content: "Webhook processed and git pull executed successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
