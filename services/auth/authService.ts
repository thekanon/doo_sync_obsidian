import { User } from "@/app/types/user";
import { logger } from "@/app/lib/logger";

export interface AuthInfo {
  user: User | null;
  isAuthenticated?: boolean;
  role?: 'ADMIN' | 'USER' | 'ANONYMOUS';
}

const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    // Client-side: use current origin
    return window.location.origin;
  }
  // Server-side: use environment variable or default to the same port as the server
  return process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || process.env.SERVER_DOMAIN || 'http://localhost:33000';
};

export const fetchAuthInfo = async (): Promise<AuthInfo> => {
  const baseUrl = getBaseUrl();
  
  try {
    const response = await fetch(`${baseUrl}/api/auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // 쿠키 포함
      // Add timeout to prevent hanging requests
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      // Return default anonymous user info instead of throwing
      if (response.status === 401 || response.status === 404) {
        return {
          user: null
        };
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data; // API 응답: { user: userInfo }
  } catch (error) {
    console.error('Error fetching auth info:', error);
    // Return default anonymous user info for network errors
    return {
      user: null
    };
  }
};
