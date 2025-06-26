"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Post {
  title: string;
  excerpt: string;
  image: string;
  path: string;
  date: string;
}

const featuredPosts: Post[] = [
  {
    title: "Featured Post 1",
    excerpt: "This is a featured post with important content...",
    image: "/slide1.png",
    path: "/featured-post-1",
    date: "2024-01-15"
  },
  {
    title: "Featured Post 2", 
    excerpt: "Another important announcement or featured content...",
    image: "/slide2.png",
    path: "/featured-post-2",
    date: "2024-01-14"
  },
  {
    title: "Featured Post 3",
    excerpt: "Latest updates and important information...",
    image: "/slide3.png", 
    path: "/featured-post-3",
    date: "2024-01-13"
  },
];

export default function MainSlider() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % featuredPosts.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const currentPost = featuredPosts[index];

  return (
    <div className="relative w-full h-80 overflow-hidden mb-6 rounded-lg shadow-lg">
      <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent z-10"></div>
      <Image
        src={currentPost.image}
        alt={currentPost.title}
        fill
        className="object-cover transition-opacity duration-1000"
      />
      <div className="absolute bottom-0 left-0 right-0 p-6 text-white z-20">
        <Link href={currentPost.path} className="group">
          <h3 className="text-2xl font-bold mb-2 group-hover:text-blue-300 transition-colors">
            {currentPost.title}
          </h3>
          <p className="text-gray-200 mb-3 line-clamp-2">
            {currentPost.excerpt}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-300">{currentPost.date}</span>
            <span className="text-sm text-blue-300 group-hover:text-blue-200">
              Read more →
            </span>
          </div>
        </Link>
      </div>
      
      <div className="absolute bottom-4 right-4 flex space-x-2 z-20">
        {featuredPosts.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`w-3 h-3 rounded-full transition-all ${
              i === index ? "bg-white" : "bg-white/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
}