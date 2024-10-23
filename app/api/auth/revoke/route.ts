// app/api/auth/revoke/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { initializeFirebaseAdmin } from "@/app/lib/firebaseAdmin";

export async function POST(req: NextRequest) {
  try {
    // Firebase Admin 초기화
    initializeFirebaseAdmin();
    const auth = getAuth();

    // 요청 본문에서 uid 가져오기
    const { uid } = await req.json();

    if (!uid) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // 사용자의 리프레시 토큰 무효화
    await auth.revokeRefreshTokens(uid);

    // 토큰이 무효화된 시간 가져오기
    const userRecord = await auth.getUser(uid);
    const tokensValidAfterTime = userRecord.tokensValidAfterTime;
    const timestampSeconds = tokensValidAfterTime
      ? new Date(tokensValidAfterTime).getTime() / 1000
      : null;

    console.log(`토큰이 무효화된 시간: ${timestampSeconds}`);

    return NextResponse.json(
      {
        message: "Tokens revoked successfully",
        tokensValidAfterTime: timestampSeconds,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error revoking tokens:", error);
    return NextResponse.json(
      { error: "Failed to revoke tokens" },
      { status: 500 }
    );
  }
}
