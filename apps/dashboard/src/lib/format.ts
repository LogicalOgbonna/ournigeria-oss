// Shared display formatters for the admin dashboard.
// Consolidates ~10 duplicated local copies (see .agent/research/6.*).

const LOCALE = "en-NG";

/** Date only, e.g. "5 Aug 2026". Matches the old admins/page.tsx variant. */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleString(LOCALE, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Date + time, e.g. "5 Aug, 02:14 PM". Matches the feedback/notifications/funnel variant. */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleString(LOCALE, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Full date + time incl. year, e.g. "5 Aug 2026, 02:14 PM". Matches ingestion/files variant. */
export function formatDateTimeFull(iso: string | null | undefined): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleString(LOCALE, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Second-precision timestamp for audit surfaces, e.g. "5 Aug 2026, 02:14:37 PM". */
export function formatDateTimeSeconds(iso: string | null | undefined): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleString(LOCALE, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/** Human byte sizes, e.g. "1.5 MB". Matches ingestion/files:48. */
export function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/** Relative time, e.g. "3h ago". Matches proposals:118 / user-table:30. */
export function relativeTime(iso: string | null | undefined): string {
  if (!iso) return "-";
  const diffMs = Date.now() - new Date(iso).getTime();
  // floor at every threshold: conventional elapsed-time semantics (1m59s -> "1m ago").
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  return formatDate(iso);
}
