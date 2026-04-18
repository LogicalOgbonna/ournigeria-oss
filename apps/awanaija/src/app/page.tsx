import { Navbar } from "@/components/sections/Navbar";
import { Hero } from "@/components/sections/Hero";
import { PersonalizedData } from "@/components/sections/PersonalizedData";
import { Footer } from "@/components/sections/Footer";
import { WelcomeModal } from "@/components/civic/WelcomeModal";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero />
      <PersonalizedData />
      <Footer />
      <WelcomeModal />
    </main>
  );
}
