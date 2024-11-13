import React from "react";
import Link from "next/link";
import Image from "next/image";
import { User, UserRole } from "../types/user";
import { AUTH_STATUS_MESSAGES } from "@/app/types/auth";

interface HeaderProps {
  user?: User;
}

const Header: React.FC<HeaderProps> = ({ user }) => {
  const userRole = user?.role || UserRole.ANONYMOUS;
  const userRoleText = AUTH_STATUS_MESSAGES[userRole];
  const isLoggedIn = userRole;
  console.log("user:::", user);

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return "bg-red-100 text-red-800";
      case UserRole.VERIFIED:
        return "bg-blue-100 text-blue-800";
      case UserRole.GUEST:
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <header className="flex items-center justify-between bg-white p-2 shadow-md">
      <Link className="flex items-center" href="/">
        <Image src="/logo.svg" width={24} height={24} alt="Icon" />
        <span className="ml-2">Doo Wiki</span>
      </Link>

      <div className="flex items-center gap-2">
        <button className="rounded p-1">
          <Image
            src="/Iconly/Light/Search.svg"
            width={24}
            height={24}
            alt="Icon"
          />
        </button>

        {isLoggedIn && (
          <>
            <button className="rounded p-1">
              <Image
                src="/Iconly/Light/Notification.svg"
                width={24}
                height={24}
                alt="Icon"
              />
            </button>

            <div className="flex items-center gap-2">
              <span
                className={`text-xs px-2 py-1 rounded-full font-medium ${getRoleBadgeColor(
                  userRole
                )}`}
              >
                {userRoleText}
              </span>
              <Link href="/login" className="rounded p-1">
                <Image
                  src="/Iconly/Light/Logout.svg"
                  width={24}
                  height={24}
                  alt="Logout"
                />
              </Link>
            </div>
          </>
        )}

        {!isLoggedIn && (
          <Link href="/login" className="rounded p-1">
            <Image
              src="/Iconly/Light/Login.svg"
              width={24}
              height={24}
              alt="Login"
            />
          </Link>
        )}
      </div>
    </header>
  );
};

export default Header;
