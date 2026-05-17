import { Navbar } from "@/components/sections/Navbar";
import { Hero } from "@/components/sections/Hero";
import { PersonalizedData } from "@/components/sections/PersonalizedData";
import { Footer } from "@/components/sections/Footer";
import { WelcomeModalWrapper } from "@/components/civic/WelcomeModalWrapper";

export const dynamic = "force-dynamic";

export default function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": "https://ournigeria.ng/#website",
        "url": "https://ournigeria.ng/",
        "name": "Our Nigeria",
        "description": "Explore how Nigeria spends public money. Search 700+ budget documents across 36 states.",
        "publisher": {
          "@id": "https://ournigeria.ng/#organization"
        },
        "inLanguage": "en-NG"
      },
      {
        "@type": "Organization",
        "@id": "https://ournigeria.ng/#organization",
        "name": "Our Nigeria",
        "url": "https://ournigeria.ng/",
        "logo": {
          "@type": "ImageObject",
          "url": "https://ournigeria.ng/icon.png"
        },
        "description": "A civic technology platform tracking Nigerian government spending, budgets, and FAAC allocations."
      }
    ]
  };

  return (
    <main className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <WelcomeModalWrapper />
      <Navbar />
      <Hero />
      <PersonalizedData />
      <Footer />
    </main>
  );
}

