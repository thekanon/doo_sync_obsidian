import { useRouter } from "next/navigation";
import { useUserIcon } from "@/app/utils/authUtils";

interface UserStatusProps {
  user: any;
  userType: string;
  loading: boolean;
  error: string | null;
  onSignOut: () => Promise<void>;
}

export default function UserStatus({
  user,
  userType,
  loading,
  error,
  onSignOut,
}: UserStatusProps) {
  const router = useRouter();
  const userIcon = useUserIcon(userType);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center mt-4">
        <button
          onClick={() => router.push("/")}
          className="w-full sm:w-auto px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg transition duration-300 flex items-center justify-center text-base sm:text-lg"
        >
          홈으로 이동
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex items-center justify-center space-x-2 text-base sm:text-lg font-medium text-gray-700 p-3 bg-gray-50 rounded-lg">
        <span className="text-xl sm:text-2xl">{userIcon}</span>
        <span>현재 권한: {userType}</span>
      </div>
      <div className="grid gap-3 sm:gap-4">
        <button
          onClick={onSignOut}
          className="w-full px-4 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg transition duration-300 flex items-center justify-center text-base sm:text-lg"
        >
          로그아웃
        </button>
        <button
          onClick={() => router.push("/")}
          className="w-full px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg transition duration-300 flex items-center justify-center text-base sm:text-lg"
        >
          홈으로 이동
        </button>
      </div>
      
      {error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center text-sm sm:text-base">
          <span className="text-xl mr-2">⚠️</span>
          <span>오류: {error}</span>
        </div>
      )}
    </div>
  );
}