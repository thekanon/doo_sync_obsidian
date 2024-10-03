'use client';

import React, { useEffect, useState } from 'react';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import * as firebaseui from 'firebaseui';
import 'firebaseui/dist/firebaseui.css';

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

  useEffect(() => {
    console.log("인증 상태 관찰자 설정 중");
    const unregisterAuthObserver = firebase.auth().onAuthStateChanged(function (user) {
      console.log("인증 상태 변경됨", user);
      setLoading(true);
      if (user) {
        // 사용자가 로그인함
        user.getIdToken().then((accessToken) => {
          console.log("사용자 토큰 획득", accessToken);
          setUser(user);
          setLoading(false);
        }).catch((error) => {
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
    }, (error) => {
      console.error("인증 관찰자 오류", error);
      setError(error.message);
      setLoading(false);
    });

    return () => unregisterAuthObserver();
  }, []);

  useEffect(() => {
    if (!user) {
      console.log("FirebaseUI 초기화 중");

      const ui = firebaseui.auth.AuthUI.getInstance() || new firebaseui.auth.AuthUI(firebase.auth());
      ui.start('#firebaseui-auth-container', {
        signInOptions: [
          {
            // Google 제공자는 원탭 로그인을 지원하기 위해 Firebase Console에서 활성화되어야 합니다.
            provider: firebase.auth.GoogleAuthProvider.PROVIDER_ID,
            clientId: '756100070951-a5imkvop1rbjb8poeb1q7tnedkd2872d.apps.googleusercontent.com'
          },
        ],
        // 원탭 로그인 자격 증명 도우미를 활성화하는 데 필요합니다.
        credentialHelper: firebaseui.auth.CredentialHelper.GOOGLE_YOLO
      });

      ui.disableAutoSignIn();
    }
    if (typeof window !== 'undefined') {
      firebase.auth().onAuthStateChanged(function (user) {
        if (user) {
          // 사용자가 로그인함
          user.getIdToken().then(function (accessToken) {
            console.log("사용자 토큰 획득", accessToken);
            setUser(user);
            setLoading(false);
          }).catch((error) => {
            console.error("사용자 토큰 획득 오류", error);
            setError(error.message);
            setLoading(false);
          });
        } else {
          // 사용자가 로그아웃함
          setUser(null);
          setLoading(false);
          setError(null);
          console.log("사용자가 로그아웃함");
        }
      });
    }
  }, [user]);

  const handleSignOut = () => {
    if (typeof window !== 'undefined') {
      firebase.auth().signOut().then(() => {
        console.log("사용자가 성공적으로 로그아웃함");
      }).catch((error) => {
        console.error("로그아웃 오류", error);
        setError(error.message);
      });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <h1 className="text-3xl font-bold mb-8">내 멋진 앱에 오신 것을 환영합니다</h1>
      <div id="sign-in-status" className="text-xl mb-4">
        {user ? '로그인됨' : '로그아웃됨'}
      </div>
      {user ? (
        <button onClick={handleSignOut} className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded mb-4">
          로그아웃
        </button>
      ) : (
        <div id="firebaseui-auth-container" className="mb-4"></div>
      )}
      <pre id="account-details" className="bg-white p-4 rounded shadow-md overflow-auto max-w-full">
        {user ? JSON.stringify(user, null, 2) : '로그인되지 않음'}
      </pre>
      {loading && <p>로딩 중...</p>}
      {error && <p className="text-red-500">오류: {error}</p>}
    </div>
  );
};

export default LoginPage;