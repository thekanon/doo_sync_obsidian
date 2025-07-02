"use client";
import React, { memo } from "react";
import Header from "./Header";
import Breadcrumbs from "./Breadcrumbs";
import LeftSidebar from "./LeftSidebar";
import CurrentDirectory from "./CurrentDirectory";
import ScrollToTop from "./ScrollToTop";
import { User } from "../types/user";

interface ClientLayoutProps {
  user?: User;
  children: React.ReactNode;
}

const MemoizedHeader = memo(Header);
const MemoizedBreadcrumbs = memo(Breadcrumbs);
const MemoizedCurrentDirectory = memo(CurrentDirectory);
const MemoizedLeftSidebar = memo(LeftSidebar);

export default function ClientLayout({ user, children }: ClientLayoutProps) {
  return (
    <>
      <MemoizedHeader user={user} />
      <MemoizedBreadcrumbs />

      {/* Main Layout Container */}
      <div className="flex flex-1 max-w-full lg:max-w-[1920px] mx-auto w-full overflow-hidden">
        {/* Left Sidebar - Desktop Only */}
        <div className="hidden lg:block flex-shrink-0">
          <div className="sticky top-0 h-screen overflow-y-auto">
            <MemoizedCurrentDirectory />
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0 w-full px-2 sm:px-4 lg:px-6 py-4 sm:py-8 overflow-x-hidden">
          <div className="max-w-full lg:max-w-4xl mx-auto w-full overflow-x-hidden">
            {children}
            
            {/* Mobile Recent & Popular Posts - Below Content */}
            <div className="block xl:hidden mt-8 pt-6 border-t border-gray-200">
              <MemoizedLeftSidebar />
            </div>
          </div>
        </div>

        {/* Right Sidebar - Desktop Only */}
        <div className="hidden xl:block flex-shrink-0">
          <div className="sticky top-0 h-screen overflow-y-auto">
            <MemoizedLeftSidebar />
          </div>
        </div>
      </div>
      
      {/* Scroll to Top Button */}
      <ScrollToTop />
    </>
  );
}