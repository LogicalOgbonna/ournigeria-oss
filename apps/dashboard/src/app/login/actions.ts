"use server";

import { cookies } from "next/headers";
import { ADMIN_COOKIE } from "@/lib/constants";

const API_URL = process.env.API_URL || "http://localhost:3001";

export async function loginAction(email: string, password: string) {
  try {
    const res = await fetch(`${API_URL}/api/admin/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      return { success: false, error: data.error || "Login failed" };
    }

    // The API sets the cookie via Set-Cookie, but since this is server-to-server,
    // we need to set it ourselves on the Next.js side
    const token = extractTokenFromResponse(res);

    if (token) {
      const cookieStore = await cookies();
      cookieStore.set(ADMIN_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: "/",
      });
    }

    return { success: true, admin: data.admin };
  } catch (err) {
    console.error("Login error:", err);
    return { success: false, error: "Failed to connect to server" };
  }
}

function extractTokenFromResponse(res: Response): string | null {
  const setCookie = res.headers.get("set-cookie");
  if (!setCookie) return null;

  const match = setCookie.match(new RegExp(`${ADMIN_COOKIE}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE);
}
