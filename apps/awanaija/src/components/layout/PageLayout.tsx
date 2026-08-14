import type { ReactNode } from "react";
import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import { NavHistoryTracker } from "@/components/layout/NavHistoryTracker";
import { cn } from "@/lib/utils";

interface PageLayoutProps {
  children: ReactNode;
  /** Extra classes for the outer wrapper (usually the page background). */
  className?: string;
  /** Extra classes for the injected <main> (padding, container, etc.). */
  mainClassName?: string;
  /**
   * Skip the injected <main>. Use when `children` already renders its own
   * semantic <main> (nesting two <main> elements is invalid HTML). The Navbar
   * and Footer are still injected.
   */
  bare?: boolean;
  /**
   * Human label for this page in the back-navigation breadcrumb, so a
   * downstream <BackButton> can say "Back to {this page}". Defaults to a label
   * derived from the pathname. Pass a nice name for dynamic routes
   * (e.g. the state or official name).
   */
  navLabel?: string;
}

/**
 * Standard page shell — injects the <Navbar>, a semantic <main>, and the
 * <Footer> so individual pages stop copy-pasting the same three lines.
 *
 * The wrapper is a flex column pinned to at least the viewport height, so the
 * footer sticks to the bottom on short pages while <main> grows to fill space.
 */
export function PageLayout({
  children,
  className,
  mainClassName,
  bare = false,
  navLabel,
}: PageLayoutProps) {
  return (
    <div className={cn("flex min-h-screen flex-col", className)}>
      <NavHistoryTracker label={navLabel} />
      <Navbar />
      {bare ? (
        children
      ) : (
        <main className={cn("flex-grow", mainClassName)}>{children}</main>
      )}
      <Footer />
    </div>
  );
}
