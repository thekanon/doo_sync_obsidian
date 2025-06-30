import { getAuth, Auth } from "firebase-admin/auth";
import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { FirebaseError } from "firebase-admin";
import { logger } from "@/app/lib/logger";
let app: App | undefined;
let auth: Auth | undefined;

interface FirebaseAuthError extends FirebaseError {
  code: string;
  message: string;
}

const serviceAccountKey = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY,
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: process.env.GOOGLE_CLOUD_CLIENT_X509_CERT_URL,
  universe_domain: "googleapis.com",
};

function isFirebaseAuthError(error: unknown): error is FirebaseAuthError {
  return (
    error !== null &&
    typeof error === "object" &&
    "code" in error &&
    typeof (error as FirebaseAuthError).code === "string"
  );
}

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
        databaseURL: process.env.FIREBASE_DATABASE_URL,
      });
      auth = getAuth(app);
      logger.debug("Firebase Admin SDK initialized successfully");
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

// 토큰 유효성 검증 함수 (서버 사이드)
/**
 *
 * @deprecated 안쓸 수도 있음.
 */
export const verifyToken = async (token: string) => {
  try {
    const auth = getAuth();
    const decodedToken = await auth.verifyIdToken(token, true); // checkRevoked: true

    return {
      isValid: true,
      uid: decodedToken.uid,
    };
  } catch (error: unknown) {
    if (isFirebaseAuthError(error)) {
      if (error.code === "auth/id-token-revoked") {
        return {
          isValid: false,
          error: "Token has been revoked",
        };
      }
    }

    return {
      isValid: false,
      error: "Invalid token",
    };
  }
};
