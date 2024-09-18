import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

const ObsidianLayout = async ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex h-screen flex-col">
      <header
        className="flex items-center justify-between bg-white p-2 shadow-md
      "
      >
        <Link className="flex items-center" href="/dashboard">
          {/* 왼쪽 아이콘과 텍스트 */}
          <Image src="/logo.svg" width={24} height={24} alt="Icon" />
          <span className="ml-2">Dev Quiz</span>
        </Link>
        <div
          className="flex items-center gap-2
        "
        >
          {/* 검색창 */}
          <button className="rounded p-1">
            <Image
              src="/Iconly/Light/Search.svg"
              width={24}
              height={24}
              alt="Icon"
            />
          </button>
          <button className="rounded p-1">
            <Image
              src="/Iconly/Light/Notification.svg"
              width={24}
              height={24}
              alt="Icon"
            />
          </button>
          <button className="rounded p-1">
            <Image
              src="/Iconly/Light/Setting.svg"
              width={24}
              height={24}
              alt="Icon"
            />
          </button>
        </div>
      </header>

      <div className="flex-grow overflow-y-auto">{children}</div>
    </div>
  );
};

export default ObsidianLayout;
