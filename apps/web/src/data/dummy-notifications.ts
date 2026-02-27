import type { SystemBanner, Notification } from "@/types/notifications";

export const dummyBanners: SystemBanner[] = [
  {
    id: "banner-1",
    type: "announcement",
    title: "New Feature",
    message:
      "You can now compare budgets across states! Try asking about spending differences.",
    link: { text: "Learn more", url: "/" },
    dismissible: true,
  },
];

export const dummyNotifications: Notification[] = [
  {
    id: "notif-1",
    type: "announcement",
    title: "Budget data updated",
    message:
      "We've added 2026 proposed budget data for Lagos, Kano, and Rivers states.",
    read: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "notif-2",
    type: "info",
    title: "Welcome to OurNigeria",
    message:
      "Ask questions about Nigerian government budgets across all 36 states and the FCT.",
    read: false,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "notif-3",
    type: "warning",
    title: "Scheduled maintenance",
    message:
      "OurNigeria will undergo brief maintenance on Saturday, March 1st from 2:00 AM to 4:00 AM WAT.",
    read: true,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "notif-4",
    type: "incident",
    title: "Resolved: Slow responses",
    message:
      "The issue causing slow AI responses has been resolved. Thank you for your patience.",
    read: true,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "notif-5",
    type: "announcement",
    title: "Share your conversations",
    message:
      "You can now share interesting budget conversations with a public link. Click the Share button in any chat.",
    read: true,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
];
