"use client";

import dynamic from "next/dynamic";

// These widgets are interaction-only (a floating feedback button, an event-driven
// civic modal, a mobile FAB menu) — none are part of the initial paint. Loading
// them client-side after hydration keeps their JS off the critical path, which
// helps TBT/INP without changing behaviour: they still mount and work as before.
const FeedbackFab = dynamic(
  () => import("./FeedbackFab").then((m) => m.FeedbackFab),
  { ssr: false },
);
const CivicModal = dynamic(
  () => import("./civic/CivicModal").then((m) => m.CivicModal),
  { ssr: false },
);
const MobileFabMenu = dynamic(
  () => import("./sections/MobileFabMenu").then((m) => m.MobileFabMenu),
  { ssr: false },
);

export function DeferredWidgets() {
  return (
    <>
      <FeedbackFab />
      <CivicModal />
      <MobileFabMenu />
    </>
  );
}
