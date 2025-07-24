// Environment variable type definitions for type safety
/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // Next.js public environment variables
      NEXT_PUBLIC_FIREBASE_API_KEY: string;
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: string;
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: string;
      NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: string;
      NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: string;
      NEXT_PUBLIC_FIREBASE_APP_ID: string;
      
      // Firebase Admin SDK
      FIREBASE_PRIVATE_KEY: string;
      FIREBASE_PROJECT_ID: string;
      FIREBASE_CLIENT_EMAIL: string;
      FIREBASE_PRIVATE_KEY_ID: string;
      FIREBASE_CLIENT_ID: string;
      GOOGLE_CLOUD_CLIENT_X509_CERT_URL: string;
      FIREBASE_DATABASE_URL: string;
      
      // Site configuration
      SITE_NAME: string;
      SITE_URL: string;
      SITE_AUTHOR: string;
      SERVER_DOMAIN: string;
      
      // Repository and content
      REPO_PATH: string;
      OBSIDIAN_URL: string;
      OBSIDIAN_ROOT_DIR: string;
      GITHUB_WEBHOOK_SECRET: string;
      
      // Configuration files (optional)
      PRIVATE_FOLDERS_FILE?: string;
      PAGE_PERMISSIONS_FILE?: string;
      SPECIAL_PAGES_FILE?: string;
      
      // Admin configuration
      NEXT_PUBLIC_ADMIN_EMAIL?: string;
    }
  }
}

export {};