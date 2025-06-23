import fs from "fs/promises";
import path from "path";

interface IndexEntry {
  path: string;
  title: string;
  content: string;
}

let index: IndexEntry[] = [];

async function walk(dir: string) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(fullPath);
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      const content = await fs.readFile(fullPath, "utf8");
      const titleMatch = content.match(/^#\s+(.*)/m);
      const title = titleMatch ? titleMatch[1].trim() : entry.name.replace(/\.md$/, "");
      index.push({ path: fullPath, title, content });
    }
  }
}

export async function buildIndex(baseDir: string): Promise<void> {
  index = [];
  await walk(baseDir);
}

export function search(query: string): Array<{ path: string; title: string; snippet: string }> {
  const lower = query.toLowerCase();
  return index
    .filter((doc) => doc.content.toLowerCase().includes(lower) || doc.title.toLowerCase().includes(lower))
    .map((doc) => {
      const pos = doc.content.toLowerCase().indexOf(lower);
      let snippet = "";
      if (pos !== -1) {
        const start = Math.max(0, pos - 30);
        const end = Math.min(doc.content.length, pos + lower.length + 30);
        snippet = doc.content.slice(start, end).replace(/\n/g, " ");
      }
      const relative = doc.path.split("Root")[1].replace(/^\//, "");
      return { path: `/${relative}`, title: doc.title, snippet };
    });
}
