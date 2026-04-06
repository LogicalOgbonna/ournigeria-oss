import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import { LandingLoginForm } from "@/components/auth/LandingLoginForm";

export default async function LoginPage() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <LandingLoginForm />
      <Footer />
    </main>
  );
}
