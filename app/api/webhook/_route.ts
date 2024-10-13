// pages/api/webhook.ts
import fs from "fs/promises";
import { NextApiRequest, NextApiResponse } from "next";
import { execFile } from "child_process";
import util from "util";

const execFileAsync = util.promisify(execFile);
const OBSIDIAN_DIR = process.env.REPO_PATH+"/Root" as string;
const SECRET_TOKEN = process.env.WEBHOOK_SECRET_TOKEN;

export default async function GET(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Verify the secret token
  const receivedToken = req.headers["x-webhook-secret"];
  if (receivedToken !== SECRET_TOKEN) {
    return res.status(403).json({ error: "Invalid secret token" });
  }

  try {
    // Execute git pull
    const { stdout, stderr } = await execFileAsync('git', ['pull'], { cwd: OBSIDIAN_DIR });
    
    console.log("Git pull output:", stdout);
    
    if (stderr) {
      console.log("Git pull additional info:", stderr);
    }

    // Update last update time
    await updateLastPullTime();

    res.status(200).json({ message: "Repository updated successfully" });
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error during git pull:", error.message);
      // Check if the error is from execFileAsync
      if ('code' in error && typeof error.code === 'number') {
        return res.status(500).json({ 
          error: "Failed to update repository", 
          details: `Git exited with code ${error.code}. ${error.message}`
        });
      }
    }
    res.status(500).json({ error: "Failed to update repository" });
  }

}

async function updateLastPullTime() {
  const timestamp = Date.now();
  await util.promisify(fs.writeFile)(
    "/tmp/last_pull_time",
    timestamp.toString(),
    "utf8"
  );
}
