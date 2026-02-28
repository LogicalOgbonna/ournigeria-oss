import type { Metadata } from "next";
import { Inter, DM_Sans } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { FeedbackFab } from "@/components/feedback/FeedbackFab";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
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
        className={`${inter.variable} ${dmSans.variable} font-sans antialiased`}
      >
        <ThemeProvider>
          <NotificationProvider>
            {children}
            <FeedbackFab />
          </NotificationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
