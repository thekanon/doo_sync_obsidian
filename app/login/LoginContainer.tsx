"use client";

import React from "react";
import { useFirebaseAuth } from "@/app/hooks/useFirebaseAuth";
import AuthUI from "@/app/components/auth/AuthUI";
import UserStatus from "@/app/components/auth/UserStatus";

const LoginPage = () => {
  const { user, userType, loading, error, handleSignOut } = useFirebaseAuth();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-blue-100 to-purple-100 p-4 sm:p-6">
      <div className="bg-white rounded-lg shadow-xl p-4 sm:p-8 w-full max-w-[95%] sm:max-w-2xl">
        <h1 className="text-2xl sm:text-4xl font-bold mb-4 sm:mb-6 text-center text-gray-800">
          사용자 권한 안내
        </h1>

        {/* 권한 안내 섹션 */}
        <div className="mb-4 sm:mb-6 text-base sm:text-lg text-gray-600 space-y-3">
          <div className="p-3 bg-white rounded-lg shadow-sm border border-gray-100">
            <p className="flex items-center">
              <span className="font-semibold mr-2 min-w-[24px]">👑</span>
              <span>
                <strong className="block sm:inline">관리자:</strong>
                <span className="block sm:inline sm:ml-2">
                  모든 페이지에 접근 가능
                </span>
              </span>
            </p>
          </div>

          <div className="p-3 bg-white rounded-lg shadow-sm border border-gray-100">
            <p className="flex items-center">
              <span className="font-semibold mr-2 min-w-[24px]">✉️</span>
              <span>
                <strong className="block sm:inline">이메일 인증 사용자:</strong>
                <span className="block sm:inline sm:ml-2">
                  일부 페이지에 접근 가능
                </span>
              </span>
            </p>
          </div>

          <div className="p-3 bg-white rounded-lg shadow-sm border border-gray-100">
            <p className="flex items-center">
              <span className="font-semibold mr-2 min-w-[24px]">👤</span>
              <span>
                <strong className="block sm:inline">게스트 사용자:</strong>
                <span className="block sm:inline sm:ml-2">
                  일부 페이지에 접근 가능
                </span>
              </span>
            </p>
          </div>

          <div className="p-3 bg-white rounded-lg shadow-sm border border-gray-100">
            <p className="flex items-center">
              <span className="font-semibold mr-2 min-w-[24px]">🔒</span>
              <span>
                <strong className="block sm:inline">익명 사용자:</strong>
                <span className="block sm:inline sm:ml-2">
                  10개 이상의 페이지 접근 시 로그인 필요
                </span>
              </span>
            </p>
          </div>
        </div>

        {/* Firebase UI */}
        <AuthUI user={user} />

        {/* 사용자 상태 및 컨트롤 */}
        <UserStatus
          user={user}
          userType={userType}
          loading={loading}
          error={error}
          onSignOut={handleSignOut}
        />
      </div>
    </div>
  );
};

export default LoginPage;