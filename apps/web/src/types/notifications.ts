export interface SystemBanner {
  id: string;
  type: "incident" | "announcement" | "warning";
  title: string;
  message: string;
  link?: { text: string; url: string };
  dismissible: boolean;
  expiresAt?: string; // ISO 8601
}

export interface Notification {
  id: string;
  type: "incident" | "announcement" | "info" | "warning";
  title: string;
  message: string;
  read: boolean;
  createdAt: string; // ISO 8601
  link?: { text: string; url: string };
}
