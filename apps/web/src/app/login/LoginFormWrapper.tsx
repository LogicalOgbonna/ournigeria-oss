"use client";

import { useSearchParams } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";

const ERROR_MESSAGES: Record<string, string> = {
  telegram_auth_failed: "Telegram authentication failed. Please try again.",
};

export function LoginFormWrapper() {
  const searchParams = useSearchParams();
  const errorCode = searchParams.get("error");
  const error = errorCode ? ERROR_MESSAGES[errorCode] || "An error occurred. Please try again." : undefined;

  return <LoginForm error={error} />;
}
