"use client";
import { useState } from "react";
import Link from "next/link";


const popularPostsData = {
  daily: [
    {
      title: "React 18의 새로운 기능들과 마이그레이션 가이드",
      path: "/react-18-features",
      views: 2456,
      date: "2024-01-15",
      category: "React",
      excerpt: "React 18에서 추가된 새로운 기능들과 기존 프로젝트를 마이그레이션하는 방법을 알아봅시다."
    },
    {
      title: "TypeScript 5.0 완전 정복하기",
      path: "/typescript-5-guide",
      views: 1987,
      date: "2024-01-15",
      category: "TypeScript", 
      excerpt: "TypeScript 5.0의 새로운 기능과 개선사항을 실무 예제와 함께 살펴봅니다."
    },
    {
      title: "Next.js 13 App Router 심화 가이드",
      path: "/nextjs-13-app-router",
      views: 1754,
      date: "2024-01-14",
      category: "Next.js",
      excerpt: "Next.js 13의 App Router를 활용한 현대적인 웹 애플리케이션 개발 방법."
    }
  ],
  weekly: [
    {
      title: "웹 성능 최적화 완전 가이드 2024",
      path: "/web-performance-2024", 
      views: 5432,
      date: "2024-01-10",
      category: "Performance",
      excerpt: "웹사이트 성능을 극대화하는 모든 기법을 총정리했습니다."
    },
    {
      title: "모던 CSS 레이아웃 마스터하기",
      path: "/modern-css-layout",
      views: 4321,
      date: "2024-01-08",
      category: "CSS",
      excerpt: "Grid, Flexbox, Container Queries까지 모던 CSS 레이아웃의 모든 것."
    },
    {
      title: "JavaScript 비동기 프로그래밍 완전 정복",
      path: "/javascript-async-programming",
      views: 3987,
      date: "2024-01-12",
      category: "JavaScript",
      excerpt: "Promise, async/await부터 고급 패턴까지 비동기 프로그래밍의 모든 것."
    }
  ],
  monthly: [
    {
      title: "풀스택 개발자를 위한 Docker 완전 가이드",
      path: "/docker-fullstack-guide",
      views: 8765,
      date: "2023-12-28", 
      category: "DevOps",
      excerpt: "개발부터 배포까지, Docker를 활용한 완전한 개발 환경 구축 가이드."
    },
    {
      title: "React Testing Library 마스터 클래스",
      path: "/react-testing-library-master",
      views: 7654,
      date: "2023-12-25",
      category: "Testing",
      excerpt: "효과적인 React 컴포넌트 테스트 작성법과 베스트 프랙티스를 알아봅시다."
    },
    {
      title: "GraphQL vs REST API 비교 분석",
      path: "/graphql-vs-rest",
      views: 6543,
      date: "2023-12-20",
      category: "API",
      excerpt: "두 API 패러다임의 장단점을 실제 프로젝트 경험을 바탕으로 비교 분석합니다."
    }
  ]
};

type TabType = 'daily' | 'weekly' | 'monthly';

export default function PopularPosts() {
  const [activeTab, setActiveTab] = useState<TabType>('daily');

  const tabs: { key: TabType; label: string; emoji: string }[] = [
    { key: 'daily', label: 'Daily', emoji: '🔥' },
    { key: 'weekly', label: 'Weekly', emoji: '⭐' },
    { key: 'monthly', label: 'Monthly', emoji: '👑' }
  ];

  return (
    <div className="bg-white border-t border-gray-200 py-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            📈 Popular Posts
          </h2>
          <p className="text-gray-600">
            Discover the most popular content based on reader engagement
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="flex bg-gray-100 rounded-lg p-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-6 py-3 rounded-md font-medium transition-all ${
                  activeTab === tab.key
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <span className="mr-2">{tab.emoji}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {popularPostsData[activeTab].map((post, index) => (
            <Link
              key={post.path}
              href={post.path}
              className="group bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full font-medium">
                  {post.category}
                </span>
                <div className="flex items-center text-gray-500 text-sm">
                  <span className="mr-1">👁</span>
                  {post.views.toLocaleString()}
                </div>
              </div>
              
              <h3 className="font-bold text-lg text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                <div className="line-clamp-2">
                  {post.title}
                </div>
              </h3>
              
              <p className="text-gray-600 text-sm mb-4">
                <div className="line-clamp-3">
                  {post.excerpt}
                </div>
              </p>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">{post.date}</span>
                <div className="flex items-center">
                  <span className="text-2xl mr-2">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                  </span>
                  <span className="text-blue-600 group-hover:text-blue-800 font-medium">
                    Read →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}