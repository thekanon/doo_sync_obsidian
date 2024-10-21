import { getAuth, Auth } from "firebase-admin/auth";
import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import serviceAccountKey from "@/serviceAccountKey.json";
let app: App | undefined;
let auth: Auth | undefined;

export const initializeFirebaseAdmin = (): Auth => {
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
    throw new Error("Firebase Auth initialization failed");
  }
  return auth;
};

export const signOut = async (token: string): Promise<void> => {
  await auth?.revokeRefreshTokens(token);
};
