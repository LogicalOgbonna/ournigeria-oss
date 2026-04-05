import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { path } = await req.json();
  if (typeof path !== "string" || !path.startsWith("/")) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }
  revalidatePath(path);
  return NextResponse.json({ revalidated: true });
}
