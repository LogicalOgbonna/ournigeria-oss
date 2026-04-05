import { Navbar } from "@/components/sections/Navbar";
import { Hero } from "@/components/sections/Hero";
import { Features } from "@/components/sections/Features";
import { Philosophy } from "@/components/sections/Philosophy";
import { Protocol } from "@/components/sections/Protocol";
import { Stats } from "@/components/sections/Stats";
import { CallToAction } from "@/components/sections/CallToAction";
import { Footer } from "@/components/sections/Footer";
import { CivicModal } from "@/components/civic/CivicModal";
import { WelcomeModal } from "@/components/civic/WelcomeModal";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero />
      <Features />
      <Philosophy />
      <Protocol />
      <Stats />
      <CallToAction />
      <Footer />
      <CivicModal />
      <WelcomeModal />
    </main>
  );
}
