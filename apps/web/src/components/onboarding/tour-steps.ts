import type { DriveStep, Driver } from "driver.js";

interface BuildStepsOptions {
  hasMessages: boolean;
  onOpenSidebar: () => void;
  onCloseSidebar: () => void;
  getDriver: () => Driver | null;
}

export function buildTourSteps({
  hasMessages,
  onOpenSidebar,
  onCloseSidebar,
  getDriver,
}: BuildStepsOptions): DriveStep[] {
  const steps: DriveStep[] = [
    {
      element: '[data-tour="tool-selector"]',
      popover: {
        title: "Choose Your Data Source",
        description: [
          "Tap <strong>Auto</strong> to let AI pick the best source, or lock to a specific one:",
          '<div style="display:flex;flex-direction:column;gap:4px;margin-top:8px;">',
          '<span style="display:inline-flex;align-items:center;gap:6px;padding:4px 8px;border-radius:6px;background:rgba(5,150,105,0.1);font-size:12px;font-weight:500;color:#059669;">&#x2728; Auto — AI picks for you</span>',
          '<span style="display:inline-flex;align-items:center;gap:6px;padding:4px 8px;border-radius:6px;background:rgba(5,150,105,0.06);font-size:12px;color:#64748b;">&#x1F4CA; Budget — Nigerian budget data</span>',
          '<span style="display:inline-flex;align-items:center;gap:6px;padding:4px 8px;border-radius:6px;background:rgba(5,150,105,0.06);font-size:12px;color:#64748b;">&#x1F50D; Corruption — EFCC case files</span>',
          '<span style="display:inline-flex;align-items:center;gap:6px;padding:4px 8px;border-radius:6px;background:rgba(5,150,105,0.06);font-size:12px;color:#64748b;">&#x1F4B0; GovSpend — Government payments</span>',
          // '<span style="display:inline-flex;align-items:center;gap:6px;padding:4px 8px;border-radius:6px;background:rgba(5,150,105,0.06);font-size:12px;color:#64748b;">&#x1F4B3; FAAC — Federal allocations</span>',
          "</div>",
        ].join(""),
        side: "top",
        align: "start",
      },
    },
    {
      element: '[data-tour="language-selector"]',
      popover: {
        title: "Switch Language",
        description: "Toggle between English and Nigerian Pidgin.",
        side: "top",
        align: "start",
      },
    },
  ];

  // Share step
  if (hasMessages) {
    steps.push({
      element: '[data-tour="share-button"]',
      popover: {
        title: "Share Conversations",
        description:
          "Create a public link so anyone can read this conversation.",
        side: "bottom",
        align: "start",
      },
    });
  } else {
    steps.push({
      popover: {
        title: "Share Conversations",
        description:
          "After chatting, a Share button appears in the header to create a public link.",
      },
    });
  }

  steps.push(
    {
      element: '[data-tour="menu-button"]',
      popover: {
        title: "Your Chat History",
        description: "Open the sidebar to see past conversations.",
        side: "bottom",
        align: "start",
        onNextClick: () => {
          onOpenSidebar();
          setTimeout(() => {
            getDriver()?.moveNext();
          }, 350);
        },
      },
    },
    {
      element: '[data-tour="profile-button"]',
      popover: {
        title: "Your Profile",
        description: "Update your name and email.",
        side: "left",
        align: "center",
        onPrevClick: () => {
          onCloseSidebar();
          setTimeout(() => {
            getDriver()?.movePrevious();
          }, 350);
        },
        onNextClick: () => {
          onCloseSidebar();
          setTimeout(() => {
            getDriver()?.moveNext();
          }, 350);
        },
      },
    },
    {
      element: '[data-tour="feedback-button"]',
      popover: {
        title: "We Want to Hear From You!",
        description:
          "Found a bug? Have an idea? Tap this button anytime to send us feedback — text, screenshots, or videos. Don\u2019t hold back!",
        side: "top",
        align: "end",
        onPrevClick: () => {
          onOpenSidebar();
          setTimeout(() => {
            getDriver()?.movePrevious();
          }, 350);
        },
      },
    },
  );

  return steps;
}
