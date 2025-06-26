import { getServerUser } from "../lib/utils";
import dynamic from "next/dynamic";

const ClientLayout = dynamic(() => import("../components/ClientLayout"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen flex-col bg-gray-50 overflow-x-hidden max-w-full">
      <div className="h-16 bg-white shadow-md"></div>
      <div className="h-8"></div>
      <div className="flex flex-1">
        <div className="hidden lg:block w-64 bg-gray-50 border-r border-gray-200"></div>
        <div className="flex-1 p-4"></div>
        <div className="hidden xl:block w-80 bg-gray-50 border-l border-gray-200"></div>
      </div>
    </div>
  )
});

type LayoutProps = {
  children: React.ReactNode;
};



const ObsidianLayout = async ({ children }: LayoutProps) => {
  const user = await getServerUser();

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 overflow-x-hidden max-w-full">
      <ClientLayout user={user || undefined}>
        {children}
      </ClientLayout>
    </div>
  );
};

export default ObsidianLayout;
