import type { Metadata } from "next";
import {
  Instrument_Sans,
  Instrument_Serif,
  DM_Sans,
  IBM_Plex_Mono,
} from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { FeedbackFab } from "@/components/feedback/FeedbackFab";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import "./globals.css";

const instrumentSans = Instrument_Sans({
  variable: "--font-sans",
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
  weight: ["400", "500", "700"],
});

const dmSans = DM_Sans({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://spending.arinze.online",
  ),
  title: "OurNigeria - Explore How Nigeria Spends",
  description:
    "Discover how Nigeria spends public funds. Ask questions about budgets, corruption cases, and government spending across all 36 states and the FCT.",
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
        <NuqsAdapter>
          <ThemeProvider>
            <NotificationProvider>
              {children}
              <FeedbackFab />
            </NotificationProvider>
          </ThemeProvider>
        </NuqsAdapter>
      </body>
    </html>
  );
}
