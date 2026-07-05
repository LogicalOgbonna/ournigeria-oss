"use client";

import { useState, useEffect } from "react";
import { WelcomeModal } from "./WelcomeModal";
import { readPersistedLocation } from "@/hooks/usePersistedLocation";

export function WelcomeModalWrapper() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Skip onboarding if the user already has a saved location — the page will
    // load straight into it, so the "pick your location" prompt is redundant.
    if (readPersistedLocation()) return;
    // Check if the user has seen the modal before
    const hasSeenModal = localStorage.getItem("hasSeenWelcomeModal");
    if (!hasSeenModal) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem("hasSeenWelcomeModal", "true");
  };

  useEffect(() => {
    const handleLocationCompleted = () => {
      handleClose();
    };

    window.addEventListener("location-request-completed", handleLocationCompleted);
    return () => {
      window.removeEventListener("location-request-completed", handleLocationCompleted);
    };
  }, []);

  return <WelcomeModal isOpen={isOpen} onClose={handleClose} />;
}
