"use client";
import React, { useEffect, useRef, useState } from "react";
import { debounce } from "es-toolkit";
import Link from "next/link";

interface SearchResult {
  path: string;
  title: string;
  snippet: string;
}

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
}

export default function SearchModal({ open, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const fetchRef = useRef(
    debounce(async (q: string) => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(Array.isArray(data.results) ? data.results : []);
        }
      } catch (err) {
        console.error("Search error", err);
      }
    }, 300)
  );

  useEffect(() => {
    const debounced = fetchRef.current;
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      debounced.cancel();
      setResults([]);
      return;
    }
    debounced(trimmed);
    return () => debounced.cancel();
  }, [query]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded bg-white p-4 shadow"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 mb-3">
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="검색어를 입력하세요"
            className="flex-grow rounded border px-3 py-2"
          />
          <button
            onClick={onClose}
            className="rounded px-3 py-2 text-sm hover:bg-gray-100"
          >
            닫기
          </button>
        </div>
        <ul className="max-h-80 overflow-y-auto space-y-2">
          {results.map((r) => (
            <li key={r.path}>
              <Link
                href={r.path}
                onClick={onClose}
                className="block rounded p-2 hover:bg-gray-100"
              >
                <div className="font-medium">{r.title}</div>
                {r.snippet && (
                  <div className="text-sm text-gray-500">{r.snippet}</div>
                )}
              </Link>
            </li>
          ))}
          {query && results.length === 0 && (
            <li className="p-2 text-sm text-gray-500">검색 결과가 없습니다.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
