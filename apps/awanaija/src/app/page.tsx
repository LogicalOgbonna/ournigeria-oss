import { Navbar } from "@/components/sections/Navbar";
import { Hero } from "@/components/sections/Hero";
import { PersonalizedData } from "@/components/sections/PersonalizedData";
import { Footer } from "@/components/sections/Footer";
import { WelcomeModalWrapper } from "@/components/civic/WelcomeModalWrapper";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <main className="min-h-screen">
      <WelcomeModalWrapper />
      <Navbar />
      <Hero />
      <PersonalizedData />
      <Footer />
    </main>
  );
}
