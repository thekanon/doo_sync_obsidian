import React from "react";
import { User } from "../types/user";

interface StaticLayoutProps {
  user?: User;
  children: React.ReactNode;
}

export default function StaticLayout({ user, children }: StaticLayoutProps) {
  return (
    <>
      {/* Static Header Shell - SSR */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="text-xl font-bold text-gray-900">DooSync</div>
            </div>
            <div className="flex items-center space-x-4">
              {user && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-700">{user.displayName}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Breadcrumbs Shell - SSR */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="h-6"></div>
        </div>
      </div>

      {/* Main Layout Container - SSR Structure */}
      <div className="flex flex-1 max-w-full lg:max-w-[1920px] mx-auto w-full overflow-hidden">
        {/* Left Sidebar Shell - Desktop Only */}
        <div className="hidden lg:block flex-shrink-0 w-64 bg-gray-50 border-r border-gray-200">
          <div className="sticky top-0 h-screen overflow-y-auto p-4">
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0 w-full px-2 sm:px-4 lg:px-6 py-4 sm:py-8 overflow-x-hidden">
          <div className="max-w-full lg:max-w-4xl mx-auto w-full overflow-x-hidden">
            {children}
          </div>
        </div>

        {/* Right Sidebar Shell - Desktop Only */}
        <div className="hidden xl:block flex-shrink-0 w-80 bg-gray-50 border-l border-gray-200">
          <div className="sticky top-0 h-screen overflow-y-auto p-4">
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}