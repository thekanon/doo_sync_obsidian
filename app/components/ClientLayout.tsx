"use client";
import React, { memo, Suspense } from "react";
import dynamic from "next/dynamic";
import { usePreloader } from "../hooks/usePreloader";

// Static imports for critical above-the-fold components
import Header from "./Header";
import Breadcrumbs from "./Breadcrumbs";

// Dynamic imports for below-the-fold components with SSR support
const LeftSidebar = dynamic(() => import("./LeftSidebar"), {
  ssr: true,
  loading: () => (
    <div className="p-4 space-y-4">
      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
      <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
      <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
    </div>
  )
});

const CurrentDirectory = dynamic(() => import("./CurrentDirectory"), {
  ssr: true,
  loading: () => (
    <div className="p-4 space-y-2">
      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
      <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
      <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
    </div>
  )
});

const ScrollToTop = dynamic(() => import("./ScrollToTop"), {
  ssr: false
});

interface ClientLayoutProps {
  children: React.ReactNode;
}

// Memoized critical components
const MemoizedHeader = memo(Header);
const MemoizedBreadcrumbs = memo(Breadcrumbs);

export default function ClientLayout({ children }: ClientLayoutProps) {
  console.log('ClientLayout mounted!'); // Debug log
  
  // Preload critical data immediately on layout mount
  usePreloader();
  
  return (
    <>
      <MemoizedHeader />
      <MemoizedBreadcrumbs />

      {/* Main Layout Container */}
      <div className="flex flex-1 max-w-full lg:max-w-[1920px] mx-auto w-full overflow-hidden">
        {/* Left Sidebar - Desktop Only */}
        <div className="hidden lg:block flex-shrink-0">
          <div className="sticky top-0 h-screen overflow-y-auto">
            <Suspense fallback={
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
              </div>
            }>
              <CurrentDirectory />
            </Suspense>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0 w-full px-2 sm:px-4 lg:px-6 py-4 sm:py-8 overflow-x-hidden">
          <div className="max-w-full lg:max-w-4xl mx-auto w-full overflow-x-hidden">
            {children}
            
            {/* Mobile Recent & Popular Posts - Below Content */}
            <div className="block xl:hidden mt-8 pt-6 border-t border-gray-200">
              <Suspense fallback={
                <div className="p-4 space-y-4">
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
                </div>
              }>
                <LeftSidebar />
              </Suspense>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Desktop Only */}
        <div className="hidden xl:block flex-shrink-0">
          <div className="sticky top-0 h-screen overflow-y-auto">
            <Suspense fallback={
              <div className="p-4 space-y-4">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
              </div>
            }>
              <LeftSidebar />
            </Suspense>
          </div>
        </div>
      </div>
      
      {/* Scroll to Top Button */}
      <ScrollToTop />
    </>
  );
}