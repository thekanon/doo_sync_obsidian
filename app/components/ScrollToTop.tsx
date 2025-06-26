"use client";
import { useState, useEffect, useRef } from "react";
import { ChevronUp } from "lucide-react";

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);
  const [isHiding, setIsHiding] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
        setIsHiding(false);

        // Clear existing timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        // Set new timeout to hide after 1 second of no scrolling
        timeoutRef.current = setTimeout(() => {
          setIsHiding(true);
        }, 1000);
      } else {
        setIsVisible(false);
        setIsHiding(false);
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      }
    };

    window.addEventListener("scroll", toggleVisibility);

    return () => {
      window.removeEventListener("scroll", toggleVisibility);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleMouseEnter = () => {
    setIsHiding(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsHiding(true);
    }, 1000);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <button
      onClick={scrollToTop}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`fixed bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all duration-500 ease-in-out z-50 ${
        isHiding ? "opacity-30" : "opacity-100"
      }`}
      aria-label="Scroll to top"
    >
      <ChevronUp size={20} />
    </button>
  );
}
