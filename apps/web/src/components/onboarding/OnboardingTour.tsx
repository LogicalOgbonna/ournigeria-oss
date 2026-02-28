"use client";

import { useEffect, useRef } from "react";
import { driver, type Driver } from "driver.js";
import "driver.js/dist/driver.css";
import { useOnboarding } from "./use-onboarding";
import { buildTourSteps } from "./tour-steps";

interface OnboardingTourProps {
  hasMessages: boolean;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export function OnboardingTour({
  hasMessages,
  setSidebarOpen,
}: OnboardingTourProps) {
  const { shouldShow, completeTour } = useOnboarding();
  const driverRef = useRef<Driver | null>(null);

  useEffect(() => {
    if (!shouldShow) return;

    const steps = buildTourSteps({
      hasMessages,
      onOpenSidebar: () => setSidebarOpen(true),
      onCloseSidebar: () => setSidebarOpen(false),
      getDriver: () => driverRef.current,
    });

    const driverObj = driver({
      showProgress: true,
      steps,
      nextBtnText: "Next",
      prevBtnText: "Back",
      doneBtnText: "Got it!",
      popoverClass: "ournigeria-tour",
      stagePadding: 6,
      stageRadius: 12,
      allowClose: false,
      // @ts-expect-error — overlayClickNext exists at runtime but removed from Config type
      overlayClickNext: false,
      onDestroyStarted: () => {
        // Only allow closing when on the last step (user clicked "Got it!")
        if (driverObj.isLastStep()) {
          driverObj.destroy();
        }
      },
      onDestroyed: () => {
        setSidebarOpen(false);
        completeTour();
      },
    });

    driverRef.current = driverObj;
    driverObj.drive();

    return () => {
      driverObj.destroy();
    };
    // Only run when shouldShow flips to true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldShow]);

  return null;
}
