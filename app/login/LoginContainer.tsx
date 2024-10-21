"use client";

import React, { useEffect, useState } from "react";
import firebase from "firebase/compat/app";
import * as firebaseui from "firebaseui";
import "firebase/compat/auth";
import { handleAuthentication } from "@/app/lib/firebaseAuthentication";
import "firebaseui/dist/firebaseui.css";
import { useRouter } from "next/navigation";
import { getUserType } from "@/app/lib/common";

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

  const router = useRouter();

  useEffect(() => {
    console.log("인증 상태 관찰자 설정 중!");
    const unregisterAuthObserver = firebase.auth().onAuthStateChanged(
      function (user) {
        console.log("인증 상태 변경됨", user);
        setLoading(true);
        if (user) {
          // 사용자가 로그인함
          user
            .getIdToken()
            .then((accessToken) => {
              console.log("사용자 토큰 획득", accessToken);
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
          console.log("사용자가 로그아웃함");
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

  useEffect(() => {
    if (!user) {
      console.log("FirebaseUI 초기화 중");

      const ui =
        firebaseui.auth.AuthUI.getInstance() ||
        new firebaseui.auth.AuthUI(firebase.auth());
      ui.start("#firebaseui-auth-container", {
        callbacks: {
          // Called when the user has been successfully signed in.
          signInSuccessWithAuthResult: function (authResult) {
            if (authResult.user) {
              console.log(authResult.user);
            }
            if (authResult.additionalUserInfo) {
              console.log(authResult.additionalUserInfo);
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
  }, [user]);

  const getAuthInfo = async (user: firebase.User) => {
    try {
      // 로그인 성공 시 JWT 토큰을 서버에 쿠키로 저장하기 위한 핸들러
      const success = await handleAuthentication(user);
      if (success) {
        // TODO: 사용자 권한에 따라 페이지 이동
      } else {
        setError("인증에 실패했습니다.");
      }
    } catch (err) {
      setError("로그인 중 오류가 발생했습니다.");
    }
  };

  const handleSignOut = () => {
    if (typeof window !== "undefined") {
      firebase
        .auth()
        .signOut()
        .then(() => {
          console.log("사용자가 성공적으로 로그아웃함");
        })
        .catch((error) => {
          console.error("로그아웃 오류", error);
          setError(error.message);
        });
    }
  };

  const getAuthStatus = async (user: firebase.User) => {
    const userType = getUserType(user);
    switch (userType) {
      case "admin":
        setUserType("관리자");
        break;
      case "emailUser":
        setUserType("이메일 인증 사용자");
        break;
      case "anonymousUser":
        setUserType("익명 사용자");
        break;
      case "guestUser":
        setUserType("게스트");
        break;
    }
  };

  useEffect(() => {
    if (user) {
      getAuthStatus(user);
    }
  }, [user]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-blue-100 to-purple-100 p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full">
        <h1 className="text-4xl font-bold mb-6 text-center text-gray-800">
          사용자 권한 안내
        </h1>
        <div className="mb-6 text-lg text-gray-600 space-y-2">
          <p className="flex items-center">
            <span className="font-semibold mr-2">👑 관리자:</span> 모든 페이지에
            접근 가능
          </p>
          <p className="flex items-center">
            <span className="font-semibold mr-2">✉️ 이메일 인증 사용자:</span>{" "}
            일부 페이지에 접근 가능
          </p>
          <p className="flex items-center">
            <span className="font-semibold mr-2">👤 게스트:</span> 일부 페이지에
            접근 가능
          </p>
          <p className="flex items-center">
            <span className="font-semibold mr-2">🔒 로그인 미완료:</span> 일부
            페이지에 접근 가능, 5개 이상 접근 시 로그인 필요
          </p>
        </div>

        <div
          id="firebaseui-auth-container"
          className={`mb-4 ${loading || user ? "hidden" : ""}`}
        ></div>

        {loading ? (
          <div className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : user ? (
          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-2 text-lg font-medium text-gray-700">
              <span className="text-2xl">👤</span>
              <span>현재 권한: {userType}</span>
            </div>
            <button
              onClick={handleSignOut}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded transition duration-300 flex items-center justify-center"
            >
              로그아웃
            </button>
            <button
              onClick={() => router.push("/")}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition duration-300 flex items-center justify-center"
            >
              홈으로 이동
            </button>
          </div>
        ) : null}

        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded flex items-center">
            <span className="text-xl mr-2">⚠️</span>
            <span>오류: {error}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
