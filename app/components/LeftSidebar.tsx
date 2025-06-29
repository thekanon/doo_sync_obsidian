"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ApiResponse, RecentPost, PopularPost, LinkItem } from "../types/api";

// Remove duplicate interfaces - using imported types

// API fetch functions with proper error handling
const fetchRecentPosts = async (): Promise<RecentPost[]> => {
  try {
    const response = await fetch('/api/recent-posts');
    if (!response.ok) throw new Error('Failed to fetch recent posts');
    const apiResponse: ApiResponse<RecentPost[]> = await response.json();
    
    if (!apiResponse.success) {
      throw new Error(apiResponse.error || 'API request failed');
    }
    
    return apiResponse.data || [];
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching recent posts:', error);
    }
    return [];
  }
};

const fetchPopularPosts = async (): Promise<PopularPost[]> => {
  try {
    const response = await fetch('/api/popular-posts');
    if (!response.ok) throw new Error('Failed to fetch popular posts');
    const apiResponse: ApiResponse<PopularPost[]> = await response.json();
    
    if (!apiResponse.success) {
      throw new Error(apiResponse.error || 'API request failed');
    }
    
    return apiResponse.data || [];
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching popular posts:', error);
    }
    return [];
  }
};

const fetchLinks = async (): Promise<LinkItem[]> => {
  try {
    const response = await fetch('/api/links');
    if (!response.ok) throw new Error('Failed to fetch links');
    const apiResponse: ApiResponse<LinkItem[]> = await response.json();
    
    if (!apiResponse.success) {
      throw new Error(apiResponse.error || 'API request failed');
    }
    
    return apiResponse.data || [];
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching links:', error);
    }
    return [];
  }
};

type PostType = 'recent' | 'popular';

function LeftSidebarComponent() {
  const [activePostType, setActivePostType] = useState<PostType>('recent');
  const [recentPosts, setRecentPosts] = useState<RecentPost[]>([]);
  const [popularPosts, setPopularPosts] = useState<PopularPost[]>([]);
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [recentData, popularData, linksData] = await Promise.all([
          fetchRecentPosts(),
          fetchPopularPosts(),
          fetchLinks()
        ]);
        
        setRecentPosts(recentData);
        setPopularPosts(popularData);
        setLinks(linksData);
      } catch (error) {
        console.error('Error loading sidebar data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const renderPostsContent = () => {
    if (loading) {
      return (
        <div className="space-y-3">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="block p-3 bg-gray-50 rounded-lg animate-pulse">
              <div className="h-4 bg-gray-300 rounded mb-2"></div>
              <div className="flex justify-between">
                <div className="h-3 bg-gray-300 rounded w-16"></div>
                <div className="h-3 bg-gray-300 rounded w-20"></div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (activePostType === 'recent') {
      return (
        <div className="space-y-3">
          {recentPosts.map((post, index) => (
            <Link
              key={index}
              href={post.path}
              className="block p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <h4 className="font-medium text-sm text-gray-800 mb-1">
                <div className="line-clamp-2" style={{ wordBreak: 'keep-all' }}>
                  {post.title}
                </div>
              </h4>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  {post.category}
                </span>
                <span>{post.date}</span>
              </div>
            </Link>
          ))}
        </div>
      );
    } else {
      return (
        <div className="space-y-3">
          {popularPosts.map((post, index) => (
            <Link
              key={index} 
              href={post.path}
              className="block p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-lg font-bold text-gray-400">
                  #{index + 1}
                </span>
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                  {post.category}
                </span>
              </div>
              <h4 className="font-medium text-sm text-gray-800">
                <div className="line-clamp-2" style={{ wordBreak: 'keep-all' }}>
                  {post.title}
                </div>
              </h4>
            </Link>
          ))}
        </div>
      );
    }
  };

  return (
    <div className="w-full xl:w-80 bg-gray-50 xl:border-l border-gray-200 h-full overflow-y-auto">
      <div className="p-4">
        {/* Posts Toggle */}
        <div className="mb-6">
          <div className="flex bg-gray-200 rounded-lg p-1 mb-4">
            <button
              onClick={() => setActivePostType('recent')}
              className={`flex-1 px-3 py-2 text-sm rounded-md font-medium transition-colors ${
                activePostType === 'recent'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              📄 Recent
            </button>
            <button
              onClick={() => setActivePostType('popular')}
              className={`flex-1 px-3 py-2 text-sm rounded-md font-medium transition-colors ${
                activePostType === 'popular'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              🔥 Popular
            </button>
          </div>
          
          {/* Posts Content */}
          {renderPostsContent()}
        </div>

        {/* Links Section - Always Visible */}
        <div className="border-t border-gray-300 pt-4">
          <h3 className="font-bold text-lg mb-4 text-gray-800">🔗 Links</h3>
          <div className="space-y-3">
            {links.map((link, index) => (
              <a
                key={index}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-medium text-sm text-gray-800">
                    {link.title}
                  </h4>
                  <span className="text-xs text-gray-400">🔗</span>
                </div>
                {link.description && (
                  <p className="text-xs text-gray-500">{link.description}</p>
                )}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default LeftSidebarComponent;