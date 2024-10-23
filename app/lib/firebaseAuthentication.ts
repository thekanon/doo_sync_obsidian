// firebaseClient.ts
import firebase from "firebase/compat/app";
import "firebase/compat/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export const auth = firebase.auth();

export async function handleAuthentication(
  user: firebase.User
): Promise<boolean> {
  try {
    const token = await user.getIdToken();

    const response = await fetch("/api/auth", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ action: "login" }),
    });

    if (!response.ok) {
      throw new Error("서버 인증 실패");
    }

    const data = await response.json();
    console.log("서버 인증 성공");

    // 서버에서 받은 토큰을 로컬 스토리지에 저장
    localStorage.setItem("serverToken", data.token);

    // 사용자 정보를 상태나 컨텍스트에 저장
    // 예: setUser(data.user);

    return true;
  } catch (error) {
    console.error("인증 처리 중 오류 발생:", error);
    return false;
  }
}

export const handleSignOut = async () => {
  if (typeof window !== "undefined") {
    try {
      // 현재 로그인된 사용자의 uid 가져오기
      const currentUser = firebase.auth().currentUser;
      if (!currentUser?.uid) {
        throw new Error("No user is currently logged in");
      }

      // 서버에 토큰 무효화 요청
      const revokeResponse = await fetch("/api/auth/revoke", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ uid: currentUser.uid }),
      });

      if (!revokeResponse.ok) {
        throw new Error("Failed to revoke tokens");
      }

      // Firebase 로그아웃
      await firebase.auth().signOut();

      // 클라이언트 측 토큰 제거
      document.cookie =
        "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      localStorage.removeItem("token");
      sessionStorage.removeItem("token");

      console.log("로그아웃 및 토큰 무효화 완료");

      // 선택적: 로그인 페이지로 리디렉션
      window.location.href = "/login";
    } catch (error) {
      console.error("로그아웃 처리 중 오류 발생:", error);
      throw error;
    }
  }
};
