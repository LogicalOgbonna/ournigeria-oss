import type { Metadata } from "next";
import { Navbar } from "@/components/sections/Navbar";
import { Hero } from "@/components/sections/Hero";
import { Footer } from "@/components/sections/Footer";
import { PersonalizedData } from "@/components/sections/PersonalizedData";

export const metadata: Metadata = {
  title: "Our Nigeria — Follow projects, budgets & LGA money",
  description:
    "Production-style landing with personalized local government and ward data.",
  robots: { index: false, follow: false },
};

export default function OverallVariant() {
  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <Navbar />
      <Hero />
      <PersonalizedData />
      <Footer />
    </div>
  );
}
