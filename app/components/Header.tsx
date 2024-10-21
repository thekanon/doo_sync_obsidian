import React from "react";
import Link from "next/link";
import Image from "next/image";

const Header: React.FC = () => {
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
        <button className="rounded p-1">
          <Image
            src="/Iconly/Light/Notification.svg"
            width={24}
            height={24}
            alt="Icon"
          />
        </button>
        <Link href="/login" className="rounded p-1">
          <Image
            src="/Iconly/Light/Login.svg"
            width={24}
            height={24}
            alt="Icon"
          />
        </Link>
      </div>
    </header>
  );
};

export default Header;
