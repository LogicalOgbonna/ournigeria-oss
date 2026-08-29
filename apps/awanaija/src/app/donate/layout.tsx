import type { Metadata } from "next";

// The page itself is a client component, so its metadata lives here.
export const metadata: Metadata = {
  title: "Donate | OurNigeria",
  description:
    "Support OurNigeria — the open-source platform tracking Nigerian budgets, government spending and corruption cases. Every donation keeps civic data free.",
  alternates: { canonical: "/donate" },
};

export default function DonateLayout({ children }: { children: React.ReactNode }) {
  return children;
}
