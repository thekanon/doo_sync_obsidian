import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAuth } from "firebase-admin/auth";
import { initializeFirebaseAdmin } from "@/app/lib/firebaseAdmin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const authInfo = initializeFirebaseAdmin();
    const auth = getAuth();

    console.log(authInfo);

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
      // 토큰 검증
      const decodedToken = await auth.verifyIdToken(token);
      const uid = decodedToken.uid;

      // 사용자 정보 가져오기
      const userRecord = await auth.getUser(uid);

      const userInfo = {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
      };

      return NextResponse.json({ user: userInfo }, { status: 200 });
    } catch (verifyError) {
      console.error("Token verification failed:", verifyError);
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
  } catch (error) {
    console.error("Error in GET handler:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
