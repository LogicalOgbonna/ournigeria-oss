import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ success: true });
  res.cookies.set("nb_uid", "", {
    path: "/",
    expires: new Date(0),
    domain: process.env.AUTH_COOKIE_DOMAIN || undefined,
  });
  return res;
}
