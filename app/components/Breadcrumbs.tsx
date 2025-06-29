'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

/**
 * 페이지 상단에서 현재 위치를 보여주는 브레드크럼 컴포넌트
 */
export default function Breadcrumbs() {
  const pathname = usePathname()
  const encodedSegments = pathname.split('/').filter(Boolean)

  const decodedSegments = encodedSegments.map(decodeURIComponent)

  // 마지막 세그먼트가 인덱스 파일인지 확인
  const last = encodedSegments[encodedSegments.length - 1]

  const isIndexFile = last?.startsWith('_Index_of_')

  const ROOT_DIR = process.env.OBSIDIAN_ROOT_DIR || 'Root'
  if (isIndexFile) {
    // 루트 인덱스라면 브래드크럼을 표시하지 않음
    if (last === `_Index_of_${ROOT_DIR}.md`) {
      return null
    }
    // 인덱스 파일 세그먼트 제거
    encodedSegments.pop()
    decodedSegments.pop()
  }

  return (
    <nav aria-label="Breadcrumb" className="text-sm text-gray-600 px-4 py-2">
      <ol className="flex flex-wrap items-center gap-1">
        <li>
          <Link href="/" className="hover:underline">
            홈
          </Link>
        </li>
        {decodedSegments.map((segment, index) => {
          let text = segment
          if (text.startsWith('_Index_of_')) {
            text = text.replace(/^_Index_of_/, '')
          }
          text = text.replace(/\.md$/, '')

          const isLast = index === decodedSegments.length - 1

          let href: string
          if (isLast) {
            if (isIndexFile) {
              const parts = [...encodedSegments.slice(0, index + 1), last]
              href = '/' + parts.join('/')
            } else {
              href = '/' + encodedSegments.slice(0, index + 1).join('/')
            }
          } else {
            const base = encodedSegments.slice(0, index + 1).join('/')
            href =
              '/' + base + '/_Index_of_' + encodeURIComponent(decodedSegments[index]) + '.md'
          }

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
