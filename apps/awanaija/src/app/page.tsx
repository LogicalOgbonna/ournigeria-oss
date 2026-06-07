import { Navbar } from "@/components/sections/Navbar";
import { Hero } from "@/components/sections/Hero";
import { PersonalizedData } from "@/components/sections/PersonalizedData";
import { Footer } from "@/components/sections/Footer";
import { WelcomeModalWrapper } from "@/components/civic/WelcomeModalWrapper";

// ISR: the homepage's initial (pre-personalization) snapshot is cached and
// revalidated every 5 min instead of re-running the SSR API waterfall on every
// request. Per-user personalization stays fully live (client-side fetches in
// PersonalizedDataClient hit the DB in real time and are never cached).
export const revalidate = 300;

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

