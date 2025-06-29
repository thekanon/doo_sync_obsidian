"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import firebase from "firebase/compat/app";
import * as firebaseui from "firebaseui";
import "firebase/compat/auth";
import { logger } from "@/app/lib/logger";
import {
  handleAuthentication,
  handleSignOut as firebaseSignOut,
} from "@/app/lib/firebaseAuthentication";
import "firebaseui/dist/firebaseui.css";
import { useRouter } from "next/navigation";
import { getAuthStatus } from "@/app/lib/common";

// Firebase 구성 추가
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Firebase 앱 초기화
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const LoginPage = () => {
  const [user, setUser] = useState<firebase.User | null>(null);
  const [userType, setUserType] = useState<string>("게스트");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userIcon = useMemo(() => {
    switch (userType) {
      case "관리자":
        return "👑";
      case "이메일 인증 사용자":
        return "✉️";
      case "게스트 사용자":
        return "👤";
      default:
        return "🔒";
    }
  }, [userType]);

  const router = useRouter();

  useEffect(() => {
    logger.debug("인증 상태 관찰자 설정 중!");
    const unregisterAuthObserver = firebase.auth().onAuthStateChanged(
      function (user) {
        logger.debug("인증 상태 변경됨", user);
        setLoading(true);
        if (user) {
          // 사용자가 로그인함
          user
            .getIdToken()
            .then((accessToken) => {
              logger.debug("사용자 토큰 획득", accessToken);
              setUser(user);
              setLoading(false);
            })
            .catch((error) => {
              console.error("사용자 토큰 획득 오류", error);
              setError(error.message);
              setLoading(false);
            });
        } else {
          // 사용자가 로그아웃함
          logger.debug("사용자가 로그아웃함");
          setUser(null);
          setLoading(false);
        }
      },
      (error) => {
        console.error("인증 관찰자 오류", error);
        setError(error.message);
        setLoading(false);
      }
    );

    return () => unregisterAuthObserver();
  }, []);

  const getAuthInfo = useCallback(async (user: firebase.User) => {
    try {
      // 로그인 성공 시 JWT 토큰을 서버에 쿠키로 저장하기 위한 핸들러
      const success = await handleAuthentication(user);
      if (success) {
        router.push("/");
      } else {
        setError("인증에 실패했습니다.");
      }
    } catch (err) {
      setError("로그인 중 오류가 발생했습니다.");
    }
  }, [router]);

  useEffect(() => {
    if (!user) {
      logger.debug("FirebaseUI 초기화 중");

      const ui =
        firebaseui.auth.AuthUI.getInstance() ||
        new firebaseui.auth.AuthUI(firebase.auth());
      ui.start("#firebaseui-auth-container", {
        callbacks: {
          // Called when the user has been successfully signed in.
          signInSuccessWithAuthResult: function (authResult) {
            if (authResult.user) {
              logger.debug(authResult.user);
            }
            if (authResult.additionalUserInfo) {
              logger.debug(authResult.additionalUserInfo);
            }
            // Do not redirect.
            return false;
          },
        },

        signInOptions: [
          {
            provider: firebase.auth.GoogleAuthProvider.PROVIDER_ID,
            clientId:
              "756100070951-a5imkvop1rbjb8poeb1q7tnedkd2872d.apps.googleusercontent.com",
          },
          {
            provider: firebase.auth.EmailAuthProvider.PROVIDER_ID,
            requireDisplayName: false,
            signInMethod: "password",
            disableSignUp: {
              status: false,
            },
          },
          firebaseui.auth.AnonymousAuthProvider.PROVIDER_ID,
        ],
        signInFlow: "popup",
        credentialHelper: firebaseui.auth.CredentialHelper.NONE,
        adminRestrictedOperation: {
          status: true,
        },
      });

      ui.disableAutoSignIn();
    } else {
      getAuthInfo(user);
    }
  }, [user, getAuthInfo]);

  const handleSignOut = async () => {
    if (typeof window !== "undefined") {
      try {
        await firebaseSignOut();
      } catch (error: unknown) {
        if (error instanceof Error) {
          console.error("로그아웃 오류", error);
          setError(error.message);
        } else {
          console.error("알 수 없는 로그아웃 오류", error);
          setError("알 수 없는 오류가 발생했습니다.");
        }
      }
      firebase
        .auth()
        .signOut()
        .then(() => {
          logger.debug("사용자가 성공적으로 로그아웃함");
        })
        .catch((error) => {
          console.error("로그아웃 오류", error);
          setError(error.message);
        });
    }
  };

  const getAuthText = async (user: firebase.User) => {
    const authStatus = await getAuthStatus(user);
    setUserType(authStatus);
  };

  useEffect(() => {
    if (user) {
      getAuthText(user);
    }
  }, [user]);

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

        {/* FirebaseUI 컨테이너 */}
        <div
          id="firebaseui-auth-container"
          className={`mb-4 ${loading || user ? "hidden" : ""}`}
        >
          <div className="flex items-center justify-center mt-4">
            <button
              onClick={() => router.push("/")}
              className="w-full sm:w-auto px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg transition duration-300 flex items-center justify-center text-base sm:text-lg"
            >
              홈으로 이동
            </button>
          </div>
        </div>

        {/* 로딩 상태 */}
        {loading && (
          <div className="flex justify-center items-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        )}

        {/* 로그인된 사용자 정보 */}
        {!loading && user && (
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-center space-x-2 text-base sm:text-lg font-medium text-gray-700 p-3 bg-gray-50 rounded-lg">
              <span className="text-xl sm:text-2xl">{userIcon}</span>
              <span>현재 권한: {userType}</span>
            </div>
            <div className="grid gap-3 sm:gap-4">
              <button
                onClick={handleSignOut}
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
          </div>
        )}

        {/* 에러 메시지 */}
        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center text-sm sm:text-base">
            <span className="text-xl mr-2">⚠️</span>
            <span>오류: {error}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
