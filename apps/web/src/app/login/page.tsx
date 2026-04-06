import { redirect } from "next/navigation";

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ returnTo?: string }>;
}) {
  const params = (await searchParams) || {};
  const loginUrl =
    process.env.NEXT_PUBLIC_LOGIN_URL || "https://ournigeria.arinze.online/login";
  const url = new URL(loginUrl);

  if (params.returnTo) {
    url.searchParams.set("returnTo", params.returnTo);
  }

  redirect(url.toString());
}
