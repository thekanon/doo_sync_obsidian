// Unauthorized.tsx
import Link from "next/link";

export default function Unauthorized() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <div className="bg-white shadow-lg rounded-lg p-8 max-w-md text-center">
        <h1 className="text-3xl font-bold text-red-500 mb-4">
          접근 권한이 없습니다
        </h1>
        <p className="text-gray-700 mb-6">
          이 페이지에 접근할 권한이 없습니다. 적절한 권한으로 로그인했는지
          확인하세요.
        </p>
        <Link href="/" legacyBehavior>
          <a className="inline-block px-6 py-2 text-white bg-blue-500 rounded hover:bg-blue-600">
            홈으로 돌아가기
          </a>
        </Link>
      </div>
    </div>
  );
}
