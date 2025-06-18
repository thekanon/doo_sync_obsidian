'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

/**
 * 페이지 상단에서 현재 위치를 보여주는 브레드크럼 컴포넌트
 */
export default function Breadcrumbs() {
  const pathname = usePathname()
  const decoded = decodeURIComponent(pathname)
  let segments = decoded.split('/').filter(Boolean)

  // 루트 인덱스 페이지는 홈만 표시
  if (segments.length === 1 && segments[0] === '_Index_of_Root.md') {
    segments = []
  }

  return (
    <nav aria-label="Breadcrumb" className="text-sm text-gray-600 px-4 py-2">
      <ol className="flex flex-wrap items-center gap-1">
        <li>
          <Link href="/" className="hover:underline">
            홈
          </Link>
        </li>
        {segments.map((segment, index) => {
          let text = segment
          if (text.startsWith('_Index_of_')) {
            text = text.replace(/^_Index_of_/, '')
          }
          text = text.replace(/\.md$/, '')

          const href = '/' + segments.slice(0, index + 1).join('/')
          return (
            <li key={href} className="flex items-center gap-1">
              <span className="mx-1 text-gray-400">/</span>
              <Link href={href} className="hover:underline break-all">
                {text}
              </Link>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
