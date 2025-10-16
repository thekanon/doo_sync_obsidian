"use client";

import { useEffect, useState, useCallback } from "react";
import { firebase } from "@/app/lib/auth/firebaseConfig";
import {
  handleAuthentication,
  handleSignOut as firebaseSignOut,
} from "@/app/lib/firebaseAuthentication";
import { getAuthStatus } from "@/app/lib/common";
import { logger } from "@/app/lib/logger";

export function useFirebaseAuth() {
  const [user, setUser] = useState<firebase.User | null>(null);
  const [userType, setUserType] = useState<string>("게스트");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 인증 상태 관찰자 설정
  useEffect(() => {
    logger.client.debug("인증 상태 관찰자 설정 중");
    const unregisterAuthObserver = firebase.auth().onAuthStateChanged(
      function (user) {
        logger.client.debug("인증 상태 변경됨", { userId: user?.uid });
        setLoading(true);
        if (user) {
          // 사용자가 로그인함
          user
            .getIdToken()
            .then(() => {
              logger.client.debug("사용자 토큰 획득 성공");
              setUser(user);
              setLoading(false);
            })
            .catch((error) => {
              logger.client.error("사용자 토큰 획득 오류", { error: error.message });
              setError(error.message);
              setLoading(false);
            });
        } else {
          // 사용자가 로그아웃함
          logger.client.debug("사용자가 로그아웃함");
          setUser(null);
          setLoading(false);
        }
      },
      (error) => {
        logger.client.error("인증 관찰자 오류", { error: error.message });
        setError(error.message);
        setLoading(false);
      }
    );

    return () => unregisterAuthObserver();
  }, []);

  // 사용자 인증 정보 처리
  const getAuthInfo = useCallback(async (user: firebase.User) => {
    try {
      // 로그인 성공 시 JWT 토큰을 서버에 쿠키로 저장하기 위한 핸들러
      const success = await handleAuthentication(user);
      if (!success) {
        const errorMsg = "인증에 실패했습니다.";
        logger.client.error(errorMsg);
        setError(errorMsg);
      }
    } catch (err) {
      const errorMsg = "로그인 중 오류가 발생했습니다.";
      logger.client.error(errorMsg, { error: err });
      setError(errorMsg);
    }
  }, []);

  // 로그아웃 처리
  const handleSignOut = useCallback(async () => {
    if (typeof window === "undefined") return;

    try {
      await firebaseSignOut();
      await firebase.auth().signOut();
      logger.client.info("사용자가 성공적으로 로그아웃함");
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";
      logger.client.error("로그아웃 오류", { error: errorMsg });
      setError(errorMsg);
    }
  }, []);

  // 사용자 권한 텍스트 가져오기
  const getAuthText = useCallback(async (user: firebase.User) => {
    const authStatus = await getAuthStatus(user);
    setUserType(authStatus);
  }, []);

  // 사용자 정보 변경 시 권한 정보 업데이트
  useEffect(() => {
    if (user) {
      getAuthText(user);
      getAuthInfo(user);
    }
  }, [user, getAuthText, getAuthInfo]);

  return {
    user,
    userType,
    loading,
    error,
    handleSignOut,
    setError,
  };
}