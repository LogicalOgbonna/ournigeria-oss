"use client";

import { useState, useEffect } from "react";
import { WelcomeModal } from "./WelcomeModal";

export function WelcomeModalWrapper() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
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

  return <WelcomeModal isOpen={isOpen} onClose={handleClose} />;
}
