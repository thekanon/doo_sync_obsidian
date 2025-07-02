import { getServerUser } from "../lib/utils";
import dynamic from "next/dynamic";
type LayoutProps = {
  children: React.ReactNode;
};

const ObsidianLayout = ({ children }: LayoutProps) => {
  return <>{children}</>;
};

export default ObsidianLayout;
