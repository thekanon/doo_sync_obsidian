import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "DooWiki",
    template: "%s | DooWiki",
  },
  description: "DooWiki - Dooveloper Wiki",
  keywords: ["DooWiki", "Dooveloper", "Wiki", "Frontend", "React", "Next.js"],
  authors: [{ name: "DooDeveloper", url: "https://doowiki.site" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://doowiki.site",
    title: "DooWiki - Dooveloper Wiki",
    description: "DooWiki - Dooveloper Wiki",
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
        {children}
      </body>
    </html>
  );
}