"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/ThemeToggle";

const breadcrumbMap: Record<string, string> = {
  dashboard: "Overview",
  users: "Users",
  ingestion: "Ingestion",
  alerts: "Notifications",
  new: "New Run",
  history: "History",
  records: "Records",
  admins: "Admin Users",
  audit: "Audit Log",
  mine: "My Activity",
  campaigns: "Election Tickets",
  elections: "Election Events",
};

/**
 * Full-path wins over the per-segment map: `queue`/`order`/`roles` are generic
 * words that mean something else under another section (e.g. the RBAC roles
 * page at /dashboard/admins/roles), so they are keyed by path, not segment.
 */
const breadcrumbPathMap: Record<string, string> = {
  // Bare `new` means the ingestion pipeline's "New Run" in the map above.
  "/dashboard/campaigns/new": "New Ticket",
  "/dashboard/campaigns/queue": "Review Queue",
  "/dashboard/campaigns/order": "Rail Order",
  "/dashboard/campaigns/roles": "Council Roles",
  "/dashboard/elections/new": "New Event",
};

export function Header() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  const crumbs = segments.map((segment, i) => {
    const href = "/" + segments.slice(0, i + 1).join("/");
    const label = breadcrumbPathMap[href] || breadcrumbMap[segment] || segment;
    return { href, label };
  });

  return (
    <header className="flex h-12 items-center gap-2 border-b border-border px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 !h-4" />
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        {crumbs.map((crumb, i) => (
          <span key={crumb.href} className="flex items-center gap-1">
            {i > 0 && <span className="mx-1">/</span>}
            {i === crumbs.length - 1 ? (
              <span className="text-foreground font-medium">{crumb.label}</span>
            ) : (
              <Link href={crumb.href} className="hover:text-foreground transition-colors">
                {crumb.label}
              </Link>
            )}
          </span>
        ))}
      </nav>
      <div className="ml-auto">
        <ThemeToggle />
      </div>
    </header>
  );
}
