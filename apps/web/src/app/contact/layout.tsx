import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us | OurNigeria",
  description: "Get in touch with the OurNigeria team.",
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
