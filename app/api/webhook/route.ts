// pages/api/webhook.ts
import fs from "fs/promises";
import { NextApiRequest, NextApiResponse } from "next";
import { exec } from "child_process";
import util from "util";

const execAsync = util.promisify(exec);
const OBSIDIAN_DIR = "/home/leedo/바탕화면/source/DooSyncBrain/DooBrain/Root";
const SECRET_TOKEN = process.env.WEBHOOK_SECRET_TOKEN;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
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
    const { stdout, stderr } = await execAsync("git pull", {
      cwd: OBSIDIAN_DIR,
    });
    console.log("Git pull output:", stdout);
    if (stderr) console.error("Git pull error:", stderr);

    // Update last update time
    await updateLastPullTime();

    res.status(200).json({ message: "Repository updated successfully" });
  } catch (error) {
    console.error("Error during git pull:", error);
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
