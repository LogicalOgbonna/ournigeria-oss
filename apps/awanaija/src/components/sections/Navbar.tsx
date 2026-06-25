"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, Map, Trophy, Users, Search, Activity, Globe, Send, MessageCircle, X, Landmark, Menu, Heart } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LOGIN_URL } from "@/lib/constants";

export function Navbar() {
  const [morphed, setMorphed] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Close the "Ask Now" dropdown on scroll so it doesn't linger over the page.
  useEffect(() => {
    if (!isDropdownOpen) return;
    const close = () => setIsDropdownOpen(false);
    window.addEventListener("scroll", close, { passive: true });
    return () => window.removeEventListener("scroll", close);
  }, [isDropdownOpen]);

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
                  <Link href="/activity" className="flex items-start gap-3 rounded-xl p-3 hover:bg-muted/50 transition-colors">
                    <Activity className="mt-0.5 h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    <div>
                      <div className="text-sm font-medium text-foreground">Contribution Updates</div>
                      <div className="text-xs text-muted-foreground">Recent contributions, you should contribute too</div>
                    </div>
                  </Link>
                  <Link href="/parties" className="flex items-start gap-3 rounded-xl p-3 hover:bg-muted/50 transition-colors">
                    <Landmark className="mt-0.5 h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    <div>
                      <div className="text-sm font-medium text-foreground">Political Parties</div>
                      <div className="text-xs text-muted-foreground">Who holds power, by party</div>
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

            {/* Mobile: hamburger replaces "Ask Now" */}
            <button
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-white md:hidden cursor-pointer"
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            {/* Desktop: "Ask Now" dropdown */}
            <div
              className="relative hidden md:block"
              onMouseEnter={() => setIsDropdownOpen(true)}
              onMouseLeave={() => setIsDropdownOpen(false)}
            >
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="btn-magnetic inline-flex items-center gap-1.5 rounded-[1.25rem] bg-emerald-600 px-5 py-2 text-sm font-medium text-white cursor-pointer"
              >
                <span className="btn-slide bg-emerald-700" />
                <span className="relative z-10 flex items-center gap-1.5">
                  Ask Now
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
                  />
                </span>
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 top-full pt-2 w-48 z-50">
                  <div className="rounded-xl border border-border/50 bg-card p-2 shadow-xl shadow-black/10 backdrop-blur-sm animate-in fade-in slide-in-from-top-2 flex flex-col gap-1">
                    <a
                      href={LOGIN_URL}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-muted text-foreground"
                    >
                      <Globe className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      On Web
                    </a>
                    <a
                      href={`https://t.me/${process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "ournigeria_dev_bot"}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-muted text-foreground"
                    >
                      <Send className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      On Telegram
                    </a>
                    <button
                      onClick={() => {
                        setIsModalOpen(true);
                        setIsDropdownOpen(false);
                      }}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-muted text-left cursor-pointer text-foreground"
                    >
                      <MessageCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      On WhatsApp
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile menu panel */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-2 rounded-3xl border border-border/50 bg-background/95 backdrop-blur-2xl shadow-xl shadow-black/10 p-4 max-h-[75vh] overflow-y-auto animate-in fade-in slide-in-from-top-2">
            {/* Ask the platform */}
            <div className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Ask</div>
            <a href={LOGIN_URL} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted">
              <Globe className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> Ask on Web
            </a>
            <a href={`https://t.me/${process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "ournigeria_dev_bot"}`} target="_blank" rel="noopener noreferrer" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted">
              <Send className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> Ask on Telegram
            </a>
            <button onClick={() => { setIsModalOpen(true); setMobileMenuOpen(false); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted text-left cursor-pointer">
              <MessageCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> Ask on WhatsApp
            </button>

            <div className="my-2 border-t border-border/50" />
            <div className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">The Big Picture</div>
            <Link href="/states" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted">
              <Map className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> Browse States
            </Link>
            <Link href="/leaderboard" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted">
              <Trophy className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> State Rankings
            </Link>
            <Link href="/activity" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted">
              <Activity className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> Contribution Updates
            </Link>
            <Link href="/parties" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted">
              <Landmark className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> Political Parties
            </Link>

            <div className="my-2 border-t border-border/50" />
            <div className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Your Leaders</div>
            <Link href="/officials" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted">
              <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> All Officials
            </Link>
            <Link href="/representatives" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted">
              <Search className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> Find Your Reps
            </Link>

            <div className="my-2 border-t border-border/50" />
            <Link href="/donate" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-muted">
              <Heart className="h-4 w-4" /> Back Our Mission
            </Link>
          </div>
        )}
      </nav>

      {/* WhatsApp Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="relative w-full max-w-sm rounded-2xl border border-border/50 bg-card p-6 shadow-2xl">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50">
                <MessageCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">WhatsApp is coming</h3>
              <p className="text-sm text-muted-foreground">
                We&apos;re currently working on bringing Our Nigeria to WhatsApp. In
                the meantime, please try our Telegram bot or the Web app.
              </p>
              <button
                onClick={() => setIsModalOpen(false)}
                className="mt-6 w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 dark:bg-emerald-500 cursor-pointer"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
