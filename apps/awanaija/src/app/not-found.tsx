import Link from "next/link";
import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import { AlertCircle, Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="flex-1 flex items-center justify-center relative overflow-hidden py-32">
        {/* Deep gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-50/60 via-background to-background dark:from-emerald-950/40 dark:via-background" />

        {/* Floating orbs */}
        <div className="absolute top-[15%] left-[8%] h-80 w-80 rounded-full bg-emerald-400/12 blur-[100px] animate-orb-1 dark:bg-emerald-400/6" />
        <div className="absolute bottom-[10%] right-[5%] h-[28rem] w-[28rem] rounded-full bg-emerald-500/8 blur-[120px] animate-orb-2 dark:bg-emerald-500/4" />

        <div className="relative z-10 mx-auto max-w-3xl px-4 text-center">
          <div className="mb-8 flex justify-center">
            <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
              <AlertCircle className="h-12 w-12 text-emerald-600 dark:text-emerald-400" />
              <div className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-full border-4 border-background bg-amber-100 dark:bg-amber-900/30">
                <Search className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </div>

          <h1 className="mb-4 text-[6rem] font-[family-name:var(--font-heading)] font-bold leading-none tracking-tighter text-foreground sm:text-[8rem]">
            404
          </h1>
          
          <h2 className="mb-6 font-[family-name:var(--font-serif)] text-3xl italic text-foreground sm:text-5xl">
            Omo, this page don cast!
          </h2>
          
          <p className="mx-auto mb-10 max-w-lg text-lg text-muted-foreground sm:text-xl">
            Wetin you dey find? The page you dey look for don enter voice mail. 
            Maybe the link break, or we don move am go another place.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-emerald-600 px-8 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-700 hover:scale-105 dark:bg-emerald-500 dark:hover:bg-emerald-600"
            >
              <Home className="h-4 w-4" />
              Make we go back house
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
