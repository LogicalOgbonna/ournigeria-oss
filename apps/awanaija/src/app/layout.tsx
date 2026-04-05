import type { Metadata } from "next";
import {
  Instrument_Sans,
  DM_Sans,
  Instrument_Serif,
  IBM_Plex_Mono,
} from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import { FeedbackFab } from "@/components/FeedbackFab";
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
  title: "Our Nigeria - See Where Nigeria Money Dey Go",
  description:
    "Explore how Nigeria spends public money. Search 700+ budget documents across all 36 states. Ask questions in plain English or Pidgin and get clear, sourced answers.",
  openGraph: {
    title: "Our Nigeria - See Where Nigeria Money Dey Go",
    description:
      "Explore how Nigeria spends public money. Search 700+ budget documents across all 36 states.",
    url: "https://ournigeria.ng",
    siteName: "Our Nigeria",
    type: "website",
    locale: "en_NG",
  },
  twitter: {
    card: "summary_large_image",
    title: "Our Nigeria - See Where Nigeria Money Dey Go",
    description:
      "Explore how Nigeria spends public money. Search 700+ budget documents across all 36 states.",
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
          <FeedbackFab />
        </ThemeProvider>
      </body>
    </html>
  );
}
