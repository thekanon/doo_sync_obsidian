import React from "react";
import Link from "next/link";
import Image from "next/image";
import { User, UserRole } from "../types/user";
import { AUTH_STATUS_MESSAGES } from "@/app/types/auth";

interface HeaderProps {
  user?: User;
}

const Header: React.FC<HeaderProps> = ({ user }) => {
  const userRole = user?.role ?? UserRole.ANONYMOUS; // null 병합 연산자 사용
  const userRoleText = AUTH_STATUS_MESSAGES[userRole];
  const isLoggedIn = userRole !== UserRole.ANONYMOUS; // 명확한 로그인 상태 체크

  // 상수로 분리하여 재사용성 향상
  const ROLE_STYLES = {
    [UserRole.ADMIN]: "bg-red-100 text-red-800",
    [UserRole.VERIFIED]: "bg-blue-100 text-blue-800",
    [UserRole.GUEST]: "bg-green-100 text-green-800",
    [UserRole.ANONYMOUS]: "bg-gray-100 text-gray-800",
  } as const;

  // 이미지 공통 속성 추출
  const IconImage = ({ src, alt = "Icon" }: { src: string; alt?: string }) => (
    <Image src={src} width={24} height={24} alt={alt} />
  );

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between bg-white px-4 py-2 shadow-md">
      <Link
        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        href="/"
        aria-label="Home"
      >
        <IconImage src="/logo.svg" />
        <span className="text-lg font-medium">Doo Wiki</span>
      </Link>

      <div className="flex items-center gap-3">
        <button
          className="rounded p-1.5 hover:bg-gray-100 transition-colors"
          aria-label="Search"
        >
          <IconImage src="/Iconly/Light/Search.svg" />
        </button>

        <button
          className="rounded p-1.5 hover:bg-gray-100 transition-colors"
          aria-label="Notifications"
        >
          <IconImage src="/Iconly/Light/Notification.svg" />
        </button>

        <div className="flex items-center gap-3">
          <span
            className={`text-xs px-3 py-1.5 rounded-full font-medium ${ROLE_STYLES[userRole]}`}
            title={`User Role: ${userRoleText}`}
          >
            {userRoleText}
          </span>
          {isLoggedIn ? (
            <Link
              href="/login"
              className="rounded p-1.5 hover:bg-gray-100 transition-colors"
              aria-label="Profile"
            >
              <IconImage src="/Iconly/Light/Profile.svg" alt="Profile" />
            </Link>
          ) : (
            <Link
              href="/login"
              className="rounded p-1.5 hover:bg-gray-100 transition-colors"
              aria-label="Login"
            >
              <IconImage src="/Iconly/Light/Login.svg" alt="Login" />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
