import { Suspense } from "react";
import { LandingLoginForm } from "@/components/auth/LandingLoginForm";
import { PageLayout } from "@/components/layout/PageLayout";

export default async function LoginPage() {
  return (
    <PageLayout>
      <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-background" />}>
        <LandingLoginForm />
      </Suspense>
    </PageLayout>
  );
}
