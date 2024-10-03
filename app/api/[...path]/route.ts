import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import { marked } from "marked";
import { NextRequest, NextResponse } from "next/server";

const execAsync = promisify(exec);

marked.setOptions({
  gfm: true, // GitHub Flavored Markdown 활성화
  breaks: true, // 줄바꿈 시 <br> 태그를 추가하도록 설정
});

const OBSIDIAN_DIR = "/home/leedo/바탕화면/source/DooSyncBrain/DooBrain/Root";
const OBSIDIAN_LINK_REGEX = /\[([^\]]+)\]\(Root/g;
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
    const removeRoot = formattedLink.replace("Root/", "");
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
  console.log("🐼st");
  // console.log(content);
  const convertedIndexLinks = convertObsidianIndexLinks(content);
  console.log("🐼en");
  // console.log(convertedIndexLinks);

  const convertedContent = convertObsidianLinks(convertedIndexLinks);
  const removedRemarkContent = removeRemark(convertedContent);
  const removedTagsContent = removeTagsSection(removedRemarkContent);
  const result = await marked(removedTagsContent);
  return result;
};

const readAndProcessFile = async (filePath: string): Promise<string> => {
  const content = await fs.readFile(filePath, "utf8");
  return processContent(content);
};

export async function GET(
  request: NextRequest,
  { params }: { params: Params }
): Promise<NextResponse<ApiResponse>> {
  try {
    const { path: notePath } = params;
    const fullPath = path.join(OBSIDIAN_DIR, ...notePath);

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

// github webhook으로 push가 발생하면 이곳에서 git pull을 실행하고 last pull time을 업데이트
const verifyGithubWebhook = (req: NextRequest, body: string): boolean => {
  const signature = req.headers.get("x-hub-signature-256");
  if (!signature) {
    console.error("No signature provided");
    return false;
  }

  const hmac = crypto.createHmac("sha256", GITHUB_WEBHOOK_SECRET);
  const digest = "sha256=" + hmac.update(body).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
};

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse>> {
  // github webhook으로 push가 발생하면 이곳에서 git pull을 실행하고 last pull time을 업데이트
  try {
    const body = await request.text();

    // step 1: github에서 온 webhook인지 확인
    if (!verifyGithubWebhook(request, body)) {
      console.error("Invalid webhook signature");
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 403 }
      );
    }

    // step 2: webhook이 push 이벤트인지 확인
    console.log("Pulling latest changes from git repository");
    const event = request.headers.get("x-github-event");
    console.log("Event:", event);
    if (event !== "push") {
      console.error("Webhook action is not push, skipping git pull");
      return NextResponse.json(
        { content: "Webhook processed successfully" },
        { status: 200 }
      );
    }

    // step 3: git pull 실행
    try {
      const { stdout, stderr } = await execAsync("git pull origin main", {
        cwd: REPO_PATH,
      });
      console.log("Git pull output:", stdout);
      if (stderr) console.error("Git pull stderr:", stderr);
    } catch (error) {
      console.error("Error during git pull:", error);
      return NextResponse.json(
        { error: "Failed to pull latest changes" },
        { status: 500 }
      );
    }

    // step 4: last pull time 업데이트
    await fs.writeFile(LAST_PULL_TIME_FILE, Date.now().toString());

    // step 5: webhook 처리 완료
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
