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
