import Header from "../components/Header";
import { getServerUser } from "../lib/utils";

type LayoutProps = {
  children: React.ReactNode;
};

const ObsidianLayout = async ({ children }: LayoutProps) => {
  const user = await getServerUser();
  
  return (
    <div className="flex min-h-screen flex-col">
      <Header user={user || undefined} />
      <div className="flex-grow">{children}</div>
    </div>
  );
};

export default ObsidianLayout;