import type { Metadata } from "next";

// Post-payment confirmation page — never useful in search results.
export const metadata: Metadata = {
  title: "Donation Received | OurNigeria",
  robots: { index: false, follow: true },
};

export default function DonateSuccessLayout({ children }: { children: React.ReactNode }) {
  return children;
}
