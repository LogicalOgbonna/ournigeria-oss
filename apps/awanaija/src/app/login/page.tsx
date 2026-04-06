import { Suspense } from "react";
import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import { LandingLoginForm } from "@/components/auth/LandingLoginForm";

export default async function LoginPage() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-background" />}>
        <LandingLoginForm />
      </Suspense>
      <Footer />
    </main>
  );
}
