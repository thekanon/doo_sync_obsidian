import { NextRequest, NextResponse } from "next/server";
import { getAuth, Auth } from "firebase-admin/auth";
import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import serviceAccountKey from "@/serviceAccountKey.json";

let app: App | undefined;
let auth: Auth | undefined;

const initializeFirebaseAdmin = (): void => {
  if (getApps().length === 0) {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
      : undefined;

    if (!privateKey) {
      console.error(
        "FIREBASE_PRIVATE_KEY is not set in the environment variables"
      );
      throw new Error("Firebase configuration error");
    }

    try {
      app = initializeApp({
        credential: cert({
          ...serviceAccountKey,
          privateKey: privateKey,
        }),
        databaseURL: "https://doowiki-874c3-default-rtdb.firebaseio.com",
      });
      auth = getAuth(app);
      console.log("Firebase Admin SDK initialized successfully");
    } catch (error) {
      console.error("Failed to initialize Firebase Admin SDK:", error);
      throw error;
    }
  } else {
    app = getApps()[0];
    auth = getAuth(app);
  }

  if (!auth) {
    console.error("Firebase Auth object is not defined");
  }
};

export async function POST(req: NextRequest) {
  try {
    initializeFirebaseAdmin();

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
    console.log("Received token:", token);

    if (!token) {
      return NextResponse.json(
        { error: "Invalid token format" },
        { status: 401 }
      );
    }

    try {
      const decodedToken = await auth.verifyIdToken(token);
      console.log("Token decoded successfully:", decodedToken);
      const uid = decodedToken.uid;

      // `auth.getUser()` 호출 전에 auth가 제대로 정의되었는지 확인
      if (!auth) {
        console.error("Auth is undefined");
        return NextResponse.json(
          { error: "Auth object not initialized" },
          { status: 500 }
        );
      }

      // 사용자 정보 가져오기
      const userRecord = await auth.getUser(uid);
      console.log("User info:", userRecord);

      // 사용자 정보를 응답에 담아서 반환
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
    console.error("Error in POST handler:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
