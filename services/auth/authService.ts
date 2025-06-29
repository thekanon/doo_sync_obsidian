import { User } from "@/app/types/user";
import { logger } from "@/app/lib/logger";

const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    // Client-side: use current origin
    return window.location.origin;
  }
  // Server-side: use environment variable or default
  return process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:3000';
};

export async function fetchAuthInfo(token?: string): Promise<User> {
  if (!token) {
    throw new Error("Token is required");
  }

  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/api/auth/me`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch authentication info");
  }

  const data = await response.json();
  logger.debug("Auth data:", data);
  return data.user as User;
}
