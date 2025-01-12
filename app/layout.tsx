import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
  display: "swap",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
  display: "swap",
});

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
        className={`${geistSans.variable} ${geistMono.variable} antialiased leading-relaxed text-gray-900 bg-white`}
      >
        {children}
      </body>
    </html>
  );
}
