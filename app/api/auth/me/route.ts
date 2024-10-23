import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAuth } from "firebase-admin/auth";
import { initializeFirebaseAdmin } from "@/app/lib/firebaseAdmin";
import { FirebaseError } from "firebase-admin";

export const dynamic = "force-dynamic";

interface FirebaseAuthError extends FirebaseError {
  code: string;
  message: string;
  stack?: string;
}

function isFirebaseAuthError(error: unknown): error is FirebaseAuthError {
  return (
    error !== null &&
    typeof error === "object" &&
    "code" in error &&
    "message" in error
  );
}

export async function GET(req: NextRequest) {
  try {
    initializeFirebaseAdmin();
    const auth = getAuth();

    if (!auth) {
      console.error("Firebase Auth is not initialized");
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }

    // 쿠키에서 토큰 읽기
    const cookieStore = cookies();
    let token = cookieStore.get("token")?.value;
    if (!token) {
      token = req.headers.get("authorization")?.replace("Bearer ", "");
    }

    if (!token) {
      return NextResponse.json({ error: "No token found" }, { status: 401 });
    }

    try {
      // 토큰 검증 (checkRevoked: true 옵션 추가)
      const decodedToken = await auth.verifyIdToken(token, true);
      const uid = decodedToken.uid;

      // 사용자 정보 가져오기
      const userRecord = await auth.getUser(uid);

      // 토큰 발급 시간과 마지막 로그아웃 시간 비교
      if (userRecord.tokensValidAfterTime) {
        const tokenIssuedAt = new Date(decodedToken.iat * 1000);
        const tokensValidAfterTime = new Date(userRecord.tokensValidAfterTime);

        if (tokenIssuedAt < tokensValidAfterTime) {
          return NextResponse.json(
            { error: "Token has been revoked" },
            { status: 401 }
          );
        }
      }

      const userInfo = {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
      };

      return NextResponse.json({ user: userInfo }, { status: 200 });
    } catch (verifyError: unknown) {
      console.error("Token verification failed:", verifyError);

      if (isFirebaseAuthError(verifyError)) {
        if (verifyError.code === "auth/id-token-revoked") {
          return NextResponse.json(
            { error: "Token has been revoked" },
            { status: 401 }
          );
        }
      }

      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
  } catch (error: unknown) {
    console.error("Error in GET handler:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
