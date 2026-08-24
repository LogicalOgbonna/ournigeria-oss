import type { Metadata } from "next";
import {
  Instrument_Sans,
  DM_Sans,
  Instrument_Serif,
  IBM_Plex_Mono,
} from "next/font/google";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/ThemeProvider";
import { DeferredWidgets } from "@/components/DeferredWidgets";
import { Analytics } from "@/components/Analytics";
import "./globals.css";

const instrumentSans = Instrument_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const dmSans = DM_Sans({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

  export const metadata: Metadata = {
    metadataBase: new URL("https://ournigeria.ng"),
    title: "OurNigeria — Know Who Governs You & Where Your Money Dey Go",
    description:
      "Find out who governs you. Look up your elected officials, representatives, parties & constituencies — and track their budgets, spending & corruption cases. In English or Pidgin.",
    keywords: [
      "who is my representative Nigeria",
      "who governs me Nigeria",
      "Nigerian elected officials",
      "find my senator Nigeria",
      "Nigeria officials directory",
      "Nigerian political parties",
      "my constituency Nigeria",
      "local government area chairman",
      "LGA chairman Nigeria",
      "ward councillor Nigeria",
      "LGA budget",
      "LGA spending",
      "Nigeria government spending",
      "Nigeria budget tracker",
      "Nigeria corruption tracker",
      "EFCC cases",
      "where Nigeria money dey go",
    ],
    applicationName: "OurNigeria",
    openGraph: {
      title: "OurNigeria — Know Who Governs You & Where Your Money Dey Go",
      description:
        "Find out who governs you. Look up your elected officials, representatives, parties & constituencies — and track their budgets, spending & corruption cases.",
      url: "https://ournigeria.ng",
      siteName: "OurNigeria",
      type: "website",
      locale: "en_NG",
    },
    twitter: {
      card: "summary_large_image",
      title: "OurNigeria — Know Who Governs You & Where Your Money Dey Go",
      description:
        "Find out who governs you. Look up Nigerian officials, representatives & parties — and track their budgets, spending & corruption cases. In English or Pidgin.",
    },
  };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${instrumentSans.variable} ${dmSans.variable} ${instrumentSerif.variable} ${ibmPlexMono.variable} font-sans antialiased`}
      >
        {/* Film-grain noise overlay */}
        <div className="noise-overlay" aria-hidden="true">
          <svg width="100%" height="100%">
            <filter id="noise-filter">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.65"
                numOctaves="3"
                stitchTiles="stitch"
              />
            </filter>
            <rect width="100%" height="100%" filter="url(#noise-filter)" />
          </svg>
        </div>
        <ThemeProvider>
          {children}
          <Toaster position="bottom-left" richColors closeButton />
          <DeferredWidgets />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
