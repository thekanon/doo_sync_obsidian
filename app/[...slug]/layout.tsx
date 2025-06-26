import Header from "../components/Header";
import Breadcrumbs from "../components/Breadcrumbs";
import Sidebar from "../components/Sidebar";
import RightSidebar from "../components/RightSidebar";
import PopularPosts from "../components/PopularPosts";
import { getServerUser } from "../lib/utils";

type LayoutProps = {
  children: React.ReactNode;
};

// Mock directory data - in a real app, this would come from your API
const mockDirectories = [
  {
    name: "Frontend",
    path: "_Index_of_Frontend.md",
    isDirectory: true,
    children: [
      { name: "React", path: "react-guide.md", isDirectory: false },
      { name: "Vue.js", path: "vue-guide.md", isDirectory: false },
      { name: "Next.js", path: "nextjs-guide.md", isDirectory: false },
    ]
  },
  {
    name: "Backend", 
    path: "_Index_of_Backend.md",
    isDirectory: true,
    children: [
      { name: "Node.js", path: "nodejs-guide.md", isDirectory: false },
      { name: "Python", path: "python-guide.md", isDirectory: false },
      { name: "Database", path: "database-guide.md", isDirectory: false },
    ]
  },
  {
    name: "DevOps",
    path: "_Index_of_DevOps.md", 
    isDirectory: true,
    children: [
      { name: "Docker", path: "docker-guide.md", isDirectory: false },
      { name: "Kubernetes", path: "k8s-guide.md", isDirectory: false },
      { name: "CI/CD", path: "cicd-guide.md", isDirectory: false },
    ]
  }
];

const ObsidianLayout = async ({ children }: LayoutProps) => {
  const user = await getServerUser();
  
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header user={user || undefined} />
      <Breadcrumbs />
      
      {/* Main Layout Container */}
      <div className="flex flex-1 max-w-[1920px] mx-auto w-full">
        {/* Left Sidebar - Desktop Only */}
        <div className="hidden lg:block flex-shrink-0">
          <div className="sticky top-0 h-screen overflow-y-auto">
            <Sidebar directories={mockDirectories} />
          </div>
        </div>
        
        {/* Main Content Area */}
        <div className="flex-1 min-w-0 px-6 py-8">
          <div className="max-w-4xl mx-auto">
            {children}
          </div>
        </div>
        
        {/* Right Sidebar - Desktop Only */}
        <div className="hidden xl:block flex-shrink-0">
          <div className="sticky top-0 h-screen overflow-y-auto">
            <RightSidebar />
          </div>
        </div>
      </div>
      
      {/* Popular Posts Section */}
      <PopularPosts />
    </div>
  );
};

export default ObsidianLayout;