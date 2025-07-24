import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { CacheProvider } from "./contexts/CacheContext";
import { UserProvider } from "./contexts/UserContext";
import { getServerUser } from "./lib/utils";
import ClientLayout from "./components/ClientLayout";


// Force dynamic rendering for this layout
// 전체 앱이 동적 렌더링으로 설정되어야 함.

export const dynamic = 'force-dynamic';

// Skip validation during build time
if (typeof window === 'undefined' && process.env.NODE_ENV !== 'production' && (!process.env.SITE_NAME || !process.env.SITE_URL || !process.env.SITE_AUTHOR)) {
  console.warn('Required environment variables are missing: SITE_NAME, SITE_URL, SITE_AUTHOR');
}

const siteName = process.env.SITE_NAME || "DooWiki";
const siteUrl = process.env.SITE_URL || "https://doowiki.site";
const siteAuthor = process.env.SITE_AUTHOR || "DooDeveloper";

export const metadata: Metadata = {
  title: {
    default: siteName,
    template: `%s | ${siteName}`,
  },
  description: `${siteName} - ${siteAuthor} Wiki`,
  keywords: ["DooWiki", "Dooveloper", "Wiki", "Frontend", "React", "Next.js"],
  authors: [{ name: siteAuthor, url: siteUrl }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    title: `${siteName} - ${siteAuthor} Wiki`,
    description: `${siteName} - ${siteAuthor} Wiki`,
    images: ["/og-image.png"],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getServerUser();

  return (
    <html lang="en">
      <body
        className={`${GeistSans.className} ${GeistMono.className} antialiased leading-relaxed text-gray-900 bg-white`}
      >
        <CacheProvider>
          <UserProvider initialUser={user || undefined}>
            <ClientLayout>{children}</ClientLayout>
          </UserProvider>
        </CacheProvider>
      </body>
    </html>
  );
}