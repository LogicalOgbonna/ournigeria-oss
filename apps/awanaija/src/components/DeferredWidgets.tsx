"use client";

import dynamic from "next/dynamic";

// These widgets are interaction-only (a floating feedback button, an event-driven
// civic modal) — none are part of the initial paint. Loading them client-side
// after hydration keeps their JS off the critical path, which helps TBT/INP
// without changing behaviour: they still mount and work as before.
// Mobile navigation now lives in the top-right hamburger in <Navbar />, so the
// old bottom-right FAB menu was removed.
const FeedbackFab = dynamic(
  () => import("./FeedbackFab").then((m) => m.FeedbackFab),
  { ssr: false },
);
const CivicModal = dynamic(
  () => import("./civic/CivicModal").then((m) => m.CivicModal),
  { ssr: false },
);

export function DeferredWidgets() {
  return (
    <>
      <FeedbackFab />
      <CivicModal />
    </>
  );
}
