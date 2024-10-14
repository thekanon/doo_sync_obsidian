"use client";

import React, { useEffect, useState } from "react";
import firebase from "firebase/compat/app";
import * as firebaseui from "firebaseui";
import "firebase/compat/auth";
import handleAuthentication from "@/app/lib/firebaseAuthentication";
import "firebaseui/dist/firebaseui.css";
import { useRouter } from "next/navigation";

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    console.log("인증 상태 관찰자 설정 중");
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
      const success = await handleAuthentication(user);
      if (success) {
        router.push("/");
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

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <h1 className="text-3xl font-bold mb-8">
        관리자 로그인을 할 수 있습니다.
      </h1>
      <div id="sign-in-status" className="text-xl mb-4">
        {user ? "로그인됨" : "로그아웃됨"}
      </div>
      {user ? (
        <button
          onClick={handleSignOut}
          className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded mb-4"
        >
          로그아웃
        </button>
      ) : (
        <div id="firebaseui-auth-container" className="mb-4"></div>
      )}
      <pre
        id="account-details"
        className="bg-white p-4 rounded shadow-md overflow-auto max-w-full"
      >
        {user ? JSON.stringify(user, null, 2) : "로그인되지 않음"}
      </pre>
      {loading && <p>로딩 중...</p>}
      {error && <p className="text-red-500">오류: {error}</p>}
    </div>
  );
};

export default LoginPage;
