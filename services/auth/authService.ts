import { User } from "@/app/types/user";

export async function fetchAuthInfo(token?: string): Promise<User> {
  if (!token) {
    throw new Error("Token is required");
  }

  const response = await fetch("http://localhost:33000/api/auth/me", {
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
  console.log("data", data);
  return data.user as User;
}
