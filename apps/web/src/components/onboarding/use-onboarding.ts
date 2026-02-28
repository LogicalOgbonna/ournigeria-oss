"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "ournigeria-onboarding-completed";

export function useOnboarding() {
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY);
    if (completed) return;

    // Delay so WelcomeHero renders first
    const timer = setTimeout(() => setShouldShow(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  const completeTour = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setShouldShow(false);
  };

  const resetTour = () => {
    localStorage.removeItem(STORAGE_KEY);
    setShouldShow(true);
  };

  return { shouldShow, completeTour, resetTour };
}
