"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { PricingPlans } from "./PricingPlans";

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
}

export function PricingModal({
  isOpen,
  onClose,
  title = "Upgrade your plan",
  description = "You've reached your daily limit. Upgrade to continue exploring Nigeria's budget data without interruptions.",
}: PricingModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setMounted(true);
    }, 100);
  }, []);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Prevent scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-all p-4 sm:p-6">
      <div 
        className="relative flex max-h-[90vh] w-full max-w-5xl flex-col rounded-2xl bg-white dark:bg-slate-950 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 p-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              {title}
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {description}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-6 bg-slate-50 dark:bg-slate-900/50">
          <PricingPlans onUpgrade={() => {
            window.location.href = '/donate';
          }} />
        </div>
      </div>
    </div>
  );
}
