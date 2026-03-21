"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { APP_URL } from "@/lib/constants";

export function Navbar() {
  const [morphed, setMorphed] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => setMorphed(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      {/* Scroll sentinel — when this leaves viewport, navbar morphs */}
      <div ref={sentinelRef} className="absolute top-0 h-20 w-full" />

      <nav className="fixed top-4 left-1/2 z-50 -translate-x-1/2 w-[calc(100%-2rem)] max-w-4xl">
        <div
          className={`flex items-center justify-between rounded-[2rem] px-4 py-2.5 transition-all duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] ${
            morphed
              ? "bg-background/70 backdrop-blur-2xl border border-border/50 shadow-lg shadow-black/5"
              : "bg-transparent"
          }`}
        >
          {/* Logo */}
          <Link href="/" className="flex items-center hover-lift">
            <Image
              src="/long_logo_dark.svg"
              alt="OurNigeria"
              width={150}
              height={42}
              className="hidden dark:block"
            />
            <Image
              src="/long_logo_dark.svg"
              alt="OurNigeria"
              width={150}
              height={42}
              className="block brightness-0 dark:hidden"
            />
          </Link>

          {/* Center nav links — hidden on mobile */}
          <div className="hidden items-center gap-6 md:flex">
            <Link
              href="/#features"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground hover-lift"
            >
              Features
            </Link>
            <Link
              href="/#process"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground hover-lift"
            >
              Process
            </Link>
            <Link
              href="/#data"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground hover-lift"
            >
              Data
            </Link>
            <Link
              href="/donate"
              className="text-sm text-emerald-400 transition-colors hover:text-emerald-300 hover-lift"
            >
              Support Us
            </Link>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <a
              href={APP_URL}
              className="btn-magnetic inline-flex items-center gap-1.5 rounded-[1.25rem] bg-emerald-600 px-5 py-2 text-sm font-medium text-white"
            >
              <span className="btn-slide bg-emerald-700" />
              <span className="relative z-10 flex items-center gap-1.5">
                Enter App
                <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </a>
          </div>
        </div>
      </nav>
    </>
  );
}
