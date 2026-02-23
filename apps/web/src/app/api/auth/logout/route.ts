import { cookies } from "next/headers";

const USER_COOKIE = "nb_uid";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete(USER_COOKIE);
  return Response.json({ success: true });
}
