import { NextRequest, NextResponse } from "next/server";
// firebaseAdmin.ts
import { Auth } from "firebase-admin/auth";
import { serialize } from "cookie";
import { initializeFirebaseAdmin } from "@/app/lib/firebaseAdmin";
import { logger } from "@/app/lib/logger";

let auth: Auth | undefined;

export async function POST(req: NextRequest) {
  try {
    auth = initializeFirebaseAdmin();

    if (!auth) {
      console.error("Firebase Auth is not initialized");
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }

    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    logger.debug("Received token:", token);

    if (!token) {
      return NextResponse.json(
        { error: "Invalid token format" },
        { status: 401 }
      );
    }

    try {
      const decodedToken = await auth.verifyIdToken(token);
      logger.debug("Token decoded successfully:", decodedToken);
      const uid = decodedToken.uid;

      if (!auth) {
        console.error("Auth is undefined");
        return NextResponse.json(
          { error: "Auth object not initialized" },
          { status: 500 }
        );
      }

      const userRecord = await auth.getUser(uid);
      logger.debug("User info:", userRecord);

      const userInfo = {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
      };

      // 토큰을 httpOnly 쿠키에 저장
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict" as const,
        maxAge: 3600, // 1 hour
        path: "/",
      };

      const cookie = serialize("token", token, cookieOptions);

      // 응답 객체 생성
      const response = NextResponse.json({ user: userInfo }, { status: 200 });

      // 쿠키 설정
      response.headers.set("Set-Cookie", cookie);

      return response;
    } catch (verifyError) {
      console.error("Token verification failed auth:", verifyError);
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
  } catch (error) {
    console.error("Error in POST handler:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
