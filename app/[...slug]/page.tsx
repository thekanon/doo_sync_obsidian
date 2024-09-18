import React from "react";
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

type Params = {
  slug: string[];
};

type ObsidianData = {
  content: string;
};

async function getObsidianData(params: string[]): Promise<ObsidianData> {
  try {
    const res = await fetch(`http://localhost:3000/api/${params.join('/')}`, { next: { revalidate: 60 } });
    if (!res.ok) {
      throw new Error(`Failed to fetch data: ${res.statusText}`);
    }
    return await res.json();
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
}

function sanitizeContent(content: string): string {
  const window = new JSDOM('').window;
  const purify = DOMPurify(window as unknown as Window);
  return purify.sanitize(content);
}

function SanitizedContent({ content }: { content: string }) {
  const sanitizedContent = React.useMemo(() => sanitizeContent(content), [content]);
  return <div dangerouslySetInnerHTML={{ __html: sanitizedContent }} />;
}

export default async function Home({ params }: { params: Params }) {
  try {
    const data = await getObsidianData(params.slug);

    return (
      <div>
        <div className="prose prose-lg p-3">
          <SanitizedContent content={data.content} />
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error in Home component:", error);
    return <div>Error loading content. Please try again later.</div>;
  }
}