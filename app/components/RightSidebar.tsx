"use client";
import { useState } from "react";
import Link from "next/link";

interface Comment {
  id: string;
  author: string;
  content: string;
  date: string;
  postTitle: string;
  postPath: string;
}

interface RelatedPost {
  title: string;
  path: string;
  date: string;
  views: number;
}

const recentComments: Comment[] = [
  {
    id: "1",
    author: "김개발",
    content: "정말 유용한 정보네요! 감사합니다.",
    date: "2024-01-15",
    postTitle: "React 최신 기능들",
    postPath: "/react-features"
  },
  {
    id: "2", 
    author: "이코더",
    content: "이해하기 쉽게 설명해주셨네요.",
    date: "2024-01-14",
    postTitle: "Next.js 13 가이드",
    postPath: "/nextjs-guide"
  },
  {
    id: "3",
    author: "박프론트",
    content: "실무에 바로 적용해보겠습니다!",
    date: "2024-01-13", 
    postTitle: "TypeScript 팁",
    postPath: "/typescript-tips"
  }
];

const relatedPosts: RelatedPost[] = [
  {
    title: "JavaScript ES2024 새로운 기능들",
    path: "/javascript-es2024",
    date: "2024-01-12",
    views: 1254
  },
  {
    title: "CSS Grid vs Flexbox 완전 정리",
    path: "/css-grid-flexbox",
    date: "2024-01-11", 
    views: 987
  },
  {
    title: "웹 성능 최적화 실전 가이드",
    path: "/web-performance",
    date: "2024-01-10",
    views: 1456
  }
];

export default function RightSidebar() {
  const [activeTab, setActiveTab] = useState<'comments' | 'related'>('comments');

  return (
    <div className="w-80 bg-white border-l border-gray-200 h-full">
      <div className="p-6">
        {/* Tab Navigation */}
        <div className="flex mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('comments')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'comments'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Recent Comments
          </button>
          <button
            onClick={() => setActiveTab('related')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'related'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Related Posts
          </button>
        </div>

        {/* Content */}
        {activeTab === 'comments' && (
          <div className="space-y-4">
            <h3 className="font-bold text-lg text-gray-800 mb-4">💬 Recent Comments</h3>
            {recentComments.map((comment) => (
              <div key={comment.id} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm text-gray-800">
                    {comment.author}
                  </span>
                  <span className="text-xs text-gray-500">{comment.date}</span>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  <div className="line-clamp-2">
                    {comment.content}
                  </div>
                </p>
                <Link
                  href={comment.postPath}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  on "{comment.postTitle}"
                </Link>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'related' && (
          <div className="space-y-4">
            <h3 className="font-bold text-lg text-gray-800 mb-4">📖 Related Posts</h3>
            {relatedPosts.map((post, index) => (
              <Link
                key={index}
                href={post.path}
                className="block bg-gray-50 hover:bg-gray-100 rounded-lg p-4 transition-colors"
              >
                <h4 className="font-semibold text-sm text-gray-800 mb-2">
                  <div className="line-clamp-2">
                    {post.title}
                  </div>
                </h4>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{post.date}</span>
                  <span>👁 {post.views.toLocaleString()}</span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* SNS Integration Widget */}
        <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
          <h3 className="font-bold text-lg text-gray-800 mb-4">🔗 Follow Us</h3>
          <div className="flex space-x-3">
            <a
              href="#"
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white p-2 rounded text-center text-sm font-medium transition-colors"
            >
              Twitter
            </a>
            <a
              href="#"
              className="flex-1 bg-pink-500 hover:bg-pink-600 text-white p-2 rounded text-center text-sm font-medium transition-colors"
            >
              Instagram
            </a>
          </div>
        </div>

        {/* Ad Banner Placeholder */}
        <div className="mt-6 p-6 bg-gray-100 rounded-lg text-center">
          <div className="text-gray-500 text-sm">Advertisement</div>
          <div className="mt-2 h-32 bg-gray-200 rounded flex items-center justify-center">
            <span className="text-gray-400 text-xs">300x250 Banner</span>
          </div>
        </div>
      </div>
    </div>
  );
}