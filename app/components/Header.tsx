"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { UserRole } from "../types/user";
import { AUTH_STATUS_MESSAGES } from "@/app/types/auth";
import { debounce } from "es-toolkit";
import dynamic from "next/dynamic";

import { useUser } from "../contexts/UserContext";

const SearchModal = dynamic(() => import("./SearchModal"), { ssr: false });

const Header: React.FC = () => {
  const { user } = useUser();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const userRole = user?.role ?? UserRole.ANONYMOUS;
  const userRoleText = AUTH_STATUS_MESSAGES[userRole];
  const isLoggedIn = userRole !== UserRole.ANONYMOUS;

  const ROLE_STYLES = {
    [UserRole.ADMIN]: "bg-red-100 text-red-800",
    [UserRole.VERIFIED]: "bg-blue-100 text-blue-800",
    [UserRole.GUEST]: "bg-green-100 text-green-800",
    [UserRole.ANONYMOUS]: "bg-gray-100 text-gray-800",
  } as const;

  const IconImage = ({ src, alt = "Icon" }: { src: string; alt?: string }) => (
    <Image src={src} width={24} height={24} alt={alt} />
  );

  useEffect(() => {
    const handleScroll = debounce(() => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);
    }, 50);

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  return (
    <>
    <header
      className={`sticky top-0 z-50 flex items-center justify-between bg-white px-4 py-2 shadow-md transition-transform ${
        isVisible ? "translate-y-0" : "-translate-y-full"
      }`}
    >
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
          onClick={() => setIsSearchOpen(true)}
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
    <SearchModal open={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
};

export default Header;
