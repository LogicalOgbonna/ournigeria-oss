import type { Metadata } from "next";

// Post-payment confirmation page — never useful in search results.
export const metadata: Metadata = {
  title: "Donation Received | OurNigeria",
  robots: { index: false, follow: true },
  // Self-canonical: without this the page inherits the parent layout's
  // /donate canonical, and noindex + cross-page canonical are conflicting
  // signals that can bleed the noindex onto /donate itself.
  alternates: { canonical: "/donate/success" },
};

export default function DonateSuccessLayout({ children }: { children: React.ReactNode }) {
  return children;
}
