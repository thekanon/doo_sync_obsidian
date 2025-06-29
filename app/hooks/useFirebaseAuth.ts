"use client";

import { useEffect, useState } from "react";
import { firebase } from "@/app/lib/auth/firebaseConfig";
import {
  handleAuthentication,
  handleSignOut as firebaseSignOut,
} from "@/app/lib/firebaseAuthentication";
import { getAuthStatus } from "@/app/lib/common";

export function useFirebaseAuth() {
  const [user, setUser] = useState<firebase.User | null>(null);
  const [userType, setUserType] = useState<string>("게스트");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 인증 상태 관찰자 설정
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

  // 사용자 인증 정보 처리
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

  // 로그아웃 처리
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
          console.log("사용자가 성공적으로 로그아웃함");
        })
        .catch((error) => {
          console.error("로그아웃 오류", error);
          setError(error.message);
        });
    }
  };

  // 사용자 권한 텍스트 가져오기
  const getAuthText = async (user: firebase.User) => {
    const authStatus = await getAuthStatus(user);
    setUserType(authStatus);
  };

  // 사용자 정보 변경 시 권한 정보 업데이트
  useEffect(() => {
    if (user) {
      getAuthText(user);
      getAuthInfo(user);
    }
  }, [user]);

  return {
    user,
    userType,
    loading,
    error,
    handleSignOut,
    setError,
  };
}