/**
 * Test Setup Configuration
 * 테스트 환경 설정 및 공통 모킹 함수들
 */

// Environment variables for testing
(process.env as any).NODE_ENV = 'test';
(process.env as any).FIREBASE_PROJECT_ID = 'test-project';
(process.env as any).FIREBASE_PRIVATE_KEY = 'test-key';
(process.env as any).FIREBASE_CLIENT_EMAIL = 'test@test.com';
(process.env as any).FIREBASE_CLIENT_ID = 'test-client-id';
(process.env as any).FIREBASE_PRIVATE_KEY_ID = 'test-key-id';
(process.env as any).GOOGLE_CLOUD_CLIENT_X509_CERT_URL = 'https://test.com/cert';
(process.env as any).REPO_PATH = '/test/repo';
(process.env as any).OBSIDIAN_ROOT_DIR = 'TestRoot';
(process.env as any).NEXT_PUBLIC_ADMIN_EMAIL = 'admin@test.com';

// Global test utilities
export const mockFirebaseAdmin = {
  initializeApp: () => ({}),
  getApps: () => [],
  cert: () => ({}),
  getAuth: () => ({
    verifyIdToken: async (token: string) => {
      if (token === 'valid-token') {
        return { uid: 'test-uid', email: 'test@test.com' };
      }
      throw new Error('Invalid token');
    },
    getUser: async (uid: string) => ({
      uid,
      email: 'test@test.com',
      displayName: 'Test User'
    }),
    revokeRefreshTokens: async () => {}
  })
};

export const mockNextRequest = (options: {
  headers?: Record<string, string>;
  cookies?: Record<string, string>;
  url?: string;
}) => ({
  headers: {
    get: (key: string) => options.headers?.[key] || null
  },
  cookies: {
    get: (key: string) => ({ value: options.cookies?.[key] })
  },
  url: options.url || 'http://localhost:3000',
  nextUrl: { pathname: new URL(options.url || 'http://localhost:3000').pathname }
});

export const mockFileSystem = {
  existsSync: (path: string) => true,
  promises: {
    readdir: async (path: string, options?: any) => [
      { name: 'test-dir', isDirectory: () => true },
      { name: 'test-file.md', isDirectory: () => false }
    ],
    stat: async (path: string) => ({
      mtime: new Date('2024-01-01')
    })
  }
};