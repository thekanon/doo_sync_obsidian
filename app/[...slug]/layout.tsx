import React from "react";
import Header from "../components/Header";
import { getServerUser } from "../lib/utils";

const ObsidianLayout = async ({ children }: { children: React.ReactNode }) => {
  const user = (await getServerUser()) ?? undefined;

  return (
    <div className="flex min-h-screen flex-col">
      <Header user={user} />
      <div className="flex-grow">{children}</div>
    </div>
  );
};

export default ObsidianLayout;
