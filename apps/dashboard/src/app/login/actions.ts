"use server";

import { cookies } from "next/headers";
import { ADMIN_COOKIE } from "@/lib/constants";

export async function loginAction(username: string, password: string) {
  if (username === "admin" && password === "admin") {
    const cookieStore = await cookies();
    cookieStore.set(ADMIN_COOKIE, "authenticated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });
    return { success: true };
  }
  return { success: false, error: "Invalid credentials" };
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE);
}
