"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, Users, LayoutList, FileText, Database, Heart, Map, Trophy, Search, PlusCircle, Activity } from "lucide-react";

export function MobileFabMenu() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end md:hidden">
      {/* Menu Items */}
      {isOpen && (
        <div className="mb-4 flex flex-col items-end space-y-2 animate-in slide-in-from-bottom-4 duration-200 max-h-[70vh] overflow-y-auto pr-2 pb-2 scrollbar-hide">
          <Link 
            href="/donate"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 rounded-full bg-background px-4 py-2 shadow-lg border border-border"
          >
            <span className="text-sm font-medium text-foreground">Support Us</span>
            <Heart className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </Link>
          
          <div className="text-xs font-semibold text-muted-foreground mr-2 mt-2 mb-1 uppercase tracking-wider">About Us</div>
          <Link 
            href="/#process"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 rounded-full bg-background px-4 py-2 shadow-lg border border-border"
          >
            <span className="text-sm font-medium text-foreground">Our Process</span>
            <FileText className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </Link>
          <Link 
            href="/#features"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 rounded-full bg-background px-4 py-2 shadow-lg border border-border"
          >
            <span className="text-sm font-medium text-foreground">Features</span>
            <LayoutList className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </Link>

          <div className="text-xs font-semibold text-muted-foreground mr-2 mt-2 mb-1 uppercase tracking-wider">Civic Action</div>
          <Link 
            href="/activity"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 rounded-full bg-background px-4 py-2 shadow-lg border border-border"
          >
            <span className="text-sm font-medium text-foreground">Activity Feed</span>
            <Activity className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </Link>
          <Link 
            href="/proposals/new"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 rounded-full bg-background px-4 py-2 shadow-lg border border-border"
          >
            <span className="text-sm font-medium text-foreground">Submit Proposal</span>
            <PlusCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </Link>
          <Link 
            href="/representatives"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 rounded-full bg-background px-4 py-2 shadow-lg border border-border"
          >
            <span className="text-sm font-medium text-foreground">Find Reps</span>
            <Search className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </Link>
          <button 
            onClick={() => {
              setIsOpen(false);
              window.dispatchEvent(new CustomEvent("open-civic-modal"));
            }}
            className="flex items-center gap-3 rounded-full bg-background px-4 py-2 shadow-lg border border-border"
          >
            <span className="text-sm font-medium text-foreground">Who Governs You</span>
            <Users className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </button>

          <div className="text-xs font-semibold text-muted-foreground mr-2 mt-2 mb-1 uppercase tracking-wider">Explore Data</div>
          <Link 
            href="/#data"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 rounded-full bg-background px-4 py-2 shadow-lg border border-border"
          >
            <span className="text-sm font-medium text-foreground">Data Sources</span>
            <Database className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </Link>
          <Link 
            href="/leaderboard"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 rounded-full bg-background px-4 py-2 shadow-lg border border-border"
          >
            <span className="text-sm font-medium text-foreground">Leaderboard</span>
            <Trophy className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </Link>
          <Link 
            href="/states"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 rounded-full bg-background px-4 py-2 shadow-lg border border-border"
          >
            <span className="text-sm font-medium text-foreground">State Directory</span>
            <Map className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </Link>
        </div>
      )}

      {/* FAB Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-xl transition-transform active:scale-95"
        aria-label="Toggle mobile menu"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 -z-10 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}