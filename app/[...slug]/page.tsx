import React from "react";
import { getHost, getServerUser } from "@/app/lib/utils";
import { DirectoryFile } from "@/app/lib/obsidian/parser";
import ContentRenderer from "@/app/components/content/ContentRenderer";

type Params = {
  slug: string[];
};

type ObsidianData = {
  content: string;
  createdAt?: string;
  updatedAt?: string;
  directoryFiles?: DirectoryFile[];
};

async function fetchObsidianData(path: string): Promise<ObsidianData> {
  const res = await fetch(`${getHost()}/api/${path}`, {
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch data: ${res.statusText}`);
  }

  return await res.json();
}

export default async function Page({ params }: { params: Params }) {
  try {
    const path = params.slug.join("/");
    const data = await fetchObsidianData(path);
    const user = await getServerUser();

    return (
      <div className="w-full">
        <ContentRenderer
          content={data.content}
          path={path}
          role={user?.role}
          updatedAt={data.updatedAt}
          createdAt={data.createdAt}
          directoryFiles={data.directoryFiles}
        />
      </div>
    );
  } catch (error: unknown) {
    console.error("Error in Home component:", error);
    return (
      <div className="prose prose-lg p-3">
        없는 문서이거나 아직 작성되지 않았습니다.
      </div>
    );
  }
}