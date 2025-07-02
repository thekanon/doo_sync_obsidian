import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { CacheProvider } from "./contexts/CacheContext";

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

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={`${GeistSans.className} ${GeistMono.className} antialiased leading-relaxed text-gray-900 bg-white`}
      >
        <CacheProvider>
          {children}
        </CacheProvider>
      </body>
    </html>
  );
}