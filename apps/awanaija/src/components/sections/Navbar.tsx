"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronDown, Map, Trophy, Database, Users, Search, PlusCircle, Activity, LayoutList, FileText } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LOGIN_URL } from "@/lib/constants";

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
          className={`flex items-center justify-between rounded-[2rem] px-4 py-2.5 transition-all duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] ${morphed
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

          {/* Nav links */}
          <div className="hidden items-center gap-6 md:flex">
            {/* Explore Data Dropdown */}
            <div className="group relative">
              <button className="flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover-lift py-2">
                The Big Picture <ChevronDown className="h-4 w-4 transition-transform group-hover:rotate-180" />
              </button>
              <div className="absolute left-1/2 top-full hidden w-[500px] -translate-x-1/2 pt-2 group-hover:block animate-in fade-in slide-in-from-top-2">
                <div className="rounded-2xl border border-border bg-background p-4 shadow-xl grid grid-cols-2 gap-2">
                  <Link href="/states" className="flex items-start gap-3 rounded-xl p-3 hover:bg-muted/50 transition-colors">
                    <Map className="mt-0.5 h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    <div>
                      <div className="text-sm font-medium text-foreground">Browse States</div>
                      <div className="text-xs text-muted-foreground">Browse data state by state</div>
                    </div>
                  </Link>
                  <Link href="/leaderboard" className="flex items-start gap-3 rounded-xl p-3 hover:bg-muted/50 transition-colors">
                    <Trophy className="mt-0.5 h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    <div>
                      <div className="text-sm font-medium text-foreground">State Rankings</div>
                      <div className="text-xs text-muted-foreground">See which states have the most complete data</div>
                    </div>
                  </Link>
                </div>
              </div>
            </div>

            {/* Civic Action Dropdown */}
            <div className="group relative">
              <button className="flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover-lift py-2">
                Your Leaders <ChevronDown className="h-4 w-4 transition-transform group-hover:rotate-180" />
              </button>
              <div className="absolute left-1/2 top-full hidden w-[500px] -translate-x-1/2 pt-2 group-hover:block animate-in fade-in slide-in-from-top-2">
                <div className="rounded-2xl border border-border bg-background p-4 shadow-xl grid grid-cols-2 gap-2">
                  <Link href="/officials" className="flex items-start gap-3 rounded-xl p-3 hover:bg-muted/50 transition-colors">
                    <Users className="mt-0.5 h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    <div>
                      <div className="text-sm font-medium text-foreground">All Officials</div>
                      <div className="text-xs text-muted-foreground">Nigeria&apos;s public officials</div>
                    </div>
                  </Link>
                  <Link href="/representatives" className="flex items-start gap-3 rounded-xl p-3 hover:bg-muted/50 transition-colors">
                    <Search className="mt-0.5 h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    <div>
                      <div className="text-sm font-medium text-foreground">Find Your Reps</div>
                      <div className="text-xs text-muted-foreground">From your street to the senate</div>
                    </div>
                  </Link>
                  <Link href="/activity" className="flex items-start gap-3 rounded-xl p-3 hover:bg-muted/50 transition-colors">
                    <Activity className="mt-0.5 h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    <div>
                      <div className="text-sm font-medium text-foreground">Recent Updates</div>
                      <div className="text-xs text-muted-foreground">Recent contributions, you should contribute too</div>
                    </div>
                  </Link>
                </div>
              </div>
            </div>

            {/* About Us Dropdown */}
            {/* <div className="group relative">
              <button className="flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover-lift py-2">
                About Us <ChevronDown className="h-4 w-4 transition-transform group-hover:rotate-180" />
              </button>
              <div className="absolute left-1/2 top-full hidden w-[350px] -translate-x-1/2 pt-2 group-hover:block animate-in fade-in slide-in-from-top-2">
                <div className="rounded-2xl border border-border bg-background p-4 shadow-xl grid gap-2">
                  <Link href="/#features" className="flex items-start gap-3 rounded-xl p-3 hover:bg-muted/50 transition-colors">
                    <LayoutList className="mt-0.5 h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    <div>
                      <div className="text-sm font-medium text-foreground">Features</div>
                      <div className="text-xs text-muted-foreground">What the platform does</div>
                    </div>
                  </Link>
                  <Link href="/#process" className="flex items-start gap-3 rounded-xl p-3 hover:bg-muted/50 transition-colors">
                    <FileText className="mt-0.5 h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    <div>
                      <div className="text-sm font-medium text-foreground">Our Process</div>
                      <div className="text-xs text-muted-foreground">How we verify information</div>
                    </div>
                  </Link>
                </div>
              </div>
            </div> */}

            <Link
              href="/donate"
              className="text-sm font-medium text-emerald-600 dark:text-emerald-400 transition-colors hover:text-emerald-500 hover-lift py-2"
            >
              Back Our Mission
            </Link>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <a
              href={LOGIN_URL}
              className="btn-magnetic inline-flex items-center gap-1.5 rounded-[1.25rem] bg-emerald-600 px-5 py-2 text-sm font-medium text-white"
            >
              <span className="btn-slide bg-emerald-700" />
              <span className="relative z-10 flex items-center gap-1.5">
                Open Dashboard
                <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </a>
          </div>
        </div>
      </nav>
    </>
  );
}
