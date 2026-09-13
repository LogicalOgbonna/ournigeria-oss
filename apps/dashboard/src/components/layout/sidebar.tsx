"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import {
  LayoutDashboard,
  Users,
  Database,
  Plus,
  History,
  FileText,
  LogOut,
  MessageSquare,
  BarChart3,
  Bot,
  FlaskConical,
  FileSearch,
  Boxes,
  Search,
  FolderOpen,
  Map,
  Settings,
  Server,
  ScrollText,
  Briefcase,
  HardDrive,
  Bell,
  ClipboardList,
  Megaphone,
  ShieldCheck,
  Heart,
  MessageCircle,
  Hash,
  Activity,
  AtSign,
  Filter,
  Sparkles,
  Upload,
  KeyRound,
  ChevronRight,
  Vote,
  ListChecks,
  ArrowUpDown,
  Tags,
  CalendarDays,
  type LucideIcon,
} from "lucide-react";
import { Collapsible } from "radix-ui";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { usePermissions } from "@/lib/permissions";
import { logoutAction } from "@/app/login/actions";

interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  /** RBAC permission required to see this item; omit for always-visible. */
  permission?: string;
  /**
   * ANY-of alternative to `permission` for pages whose API reads accept more
   * than one permission (e.g. elections: writers CRUD, reviewers publish).
   */
  anyOfPermissions?: string[];
}

// Pinned, ungrouped home link rendered above all collapsible sections.
const overviewItem: NavItem = {
  title: "Overview",
  href: "/dashboard",
  icon: LayoutDashboard,
};

const communityNav: NavItem[] = [
  {
    title: "Users",
    href: "/dashboard/users",
    icon: Users,
    permission: "users.read",
  },
  {
    title: "Conversations",
    href: "/dashboard/conversations",
    icon: MessageSquare,
    permission: "conversations.read",
  },
  {
    title: "Proposals",
    href: "/dashboard/proposals",
    icon: MessageSquare,
    permission: "proposals.review",
  },
  {
    title: "Feedback",
    href: "/dashboard/feedback",
    icon: MessageSquare,
    permission: "feedback.read",
  },
  {
    title: "Donations",
    href: "/dashboard/donations",
    icon: Heart,
    permission: "donations.read",
  },
];

const electionNav: NavItem[] = [
  {
    title: "Tickets",
    href: "/dashboard/campaigns",
    icon: Vote,
    // Every campaign role (writer, reviewer, auditor, researcher) holds read.
    permission: "campaigns.read",
  },
  {
    title: "Review Queue",
    href: "/dashboard/campaigns/queue",
    icon: ListChecks,
    permission: "campaigns.review",
  },
  {
    title: "Rail Order",
    href: "/dashboard/campaigns/order",
    icon: ArrowUpDown,
    permission: "campaigns.write",
  },
  {
    title: "Council Roles",
    href: "/dashboard/campaigns/roles",
    icon: Tags,
    permission: "campaigns.read",
  },
  {
    title: "Events",
    href: "/dashboard/elections",
    icon: CalendarDays,
    // D5 split (plan 68): writers CRUD events, reviewers publish them — the
    // list is readable by both, mirroring GET /api/admin/elections.
    anyOfPermissions: ["elections.write", "campaigns.review"],
  },
];

const socialNav: NavItem[] = [
  {
    title: "Reply Queue",
    href: "/dashboard/social",
    icon: MessageCircle,
    permission: "socials.review",
  },
  {
    title: "Topics",
    href: "/dashboard/social/topics",
    icon: Hash,
    permission: "socials.review",
  },
  {
    title: "Handles",
    href: "/dashboard/social/handles",
    icon: AtSign,
    permission: "socials.review",
  },
  {
    title: "Campaign",
    href: "/dashboard/social/campaign",
    icon: Megaphone,
    permission: "socials.review",
  },
  {
    title: "Sessions",
    href: "/dashboard/social/sessions",
    icon: Activity,
    permission: "socials.review",
  },
  {
    title: "Funnel",
    href: "/dashboard/social/funnel",
    icon: Filter,
    permission: "socials.review",
  },
  {
    title: "Analytics",
    href: "/dashboard/social/analytics",
    icon: BarChart3,
    permission: "socials.review",
  },
];

const knowledgeNav: NavItem[] = [
  {
    title: "Documents",
    href: "/dashboard/documents",
    icon: FolderOpen,
    permission: "documents.read",
  },
  {
    title: "Coverage",
    href: "/dashboard/documents/coverage",
    icon: Map,
    permission: "documents.read",
  },
  {
    title: "Enrichment",
    href: "/dashboard/enrichment",
    icon: Sparkles,
    permission: "enrichment.review",
  },
  {
    title: "Imports",
    href: "/dashboard/imports",
    icon: Upload,
    permission: "imports.candidates",
  },
  {
    title: "Pipelines",
    href: "/dashboard/ingestion",
    icon: Database,
    permission: "ingestion.read",
  },
  {
    title: "S3 Files",
    href: "/dashboard/ingestion/files",
    icon: FolderOpen,
    permission: "ingestion.read",
  },
  {
    title: "New Run",
    href: "/dashboard/ingestion/new",
    icon: Plus,
    permission: "ingestion.read",
  },
  {
    title: "History",
    href: "/dashboard/ingestion/history",
    icon: History,
    permission: "ingestion.read",
  },
  {
    title: "Records",
    href: "/dashboard/ingestion/records",
    icon: FileText,
    permission: "ingestion.read",
  },
];

const aiEngineNav: NavItem[] = [
  {
    title: "Query Analytics",
    href: "/dashboard/ai",
    icon: BarChart3,
    permission: "ai.manage",
  },
  {
    title: "Citations",
    href: "/dashboard/ai/citations",
    icon: FileSearch,
    permission: "ai.manage",
  },
  {
    title: "Agent Config",
    href: "/dashboard/ai/agents",
    icon: Bot,
    permission: "ai.manage",
  },
  {
    title: "Test Query",
    href: "/dashboard/ai/test",
    icon: FlaskConical,
    permission: "ai.manage",
  },
  {
    title: "Embeddings",
    href: "/dashboard/vectors",
    icon: Boxes,
    permission: "vectors.manage",
  },
  {
    title: "Similarity Search",
    href: "/dashboard/vectors/search",
    icon: Search,
    permission: "vectors.manage",
  },
  {
    title: "Evaluation",
    href: "/dashboard/vectors/evaluation",
    icon: FlaskConical,
    permission: "vectors.manage",
  },
];

const notificationNav: NavItem[] = [
  {
    title: "Notifications",
    href: "/dashboard/notifications",
    icon: Bell,
    permission: "notifications.write",
  },
  {
    title: "Banners",
    href: "/dashboard/notifications/banners",
    icon: Megaphone,
    permission: "notifications.write",
  },
  {
    title: "Alerts",
    href: "/dashboard/alerts",
    icon: Bell,
    permission: "alerts.read",
  },
];

const systemNav: NavItem[] = [
  {
    title: "Health",
    href: "/dashboard/system",
    icon: Server,
    permission: "system.write",
  },
  {
    title: "Live Logs",
    href: "/dashboard/system/logs",
    icon: ScrollText,
    permission: "system.write",
  },
  {
    title: "Jobs",
    href: "/dashboard/system/jobs",
    icon: Briefcase,
    permission: "system.write",
  },
  {
    title: "Backups",
    href: "/dashboard/system/backups",
    icon: HardDrive,
    permission: "system.write",
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
    permission: "settings.write",
  },
];

const adminNav: NavItem[] = [
  {
    title: "Admin Users",
    href: "/dashboard/admins",
    icon: ShieldCheck,
    permission: "admins.manage",
  },
  {
    title: "Roles & Permissions",
    href: "/dashboard/admins/roles",
    icon: KeyRound,
    permission: "admins.manage",
  },
  {
    title: "Audit Log",
    href: "/dashboard/audit",
    icon: ClipboardList,
    permission: "audit.read",
  },
  { title: "My Activity", href: "/dashboard/audit/mine", icon: History },
];

const navGroups = [
  { label: "Community", items: communityNav },
  { label: "Election Tickets", items: electionNav },
  { label: "Social", items: socialNav },
  { label: "Knowledge Base", items: knowledgeNav },
  { label: "AI Engine", items: aiEngineNav },
  { label: "Notifications", items: notificationNav },
  { label: "System", items: systemNav },
  { label: "Admin", items: adminNav },
];

const GROUPS_COOKIE_NAME = "dashboard_sidebar_groups";
const GROUPS_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

function isActive(pathname: string, href: string, items: NavItem[]) {
  if (href === "/dashboard") return pathname === "/dashboard";
  if (pathname === href) return true;
  if (!pathname.startsWith(href + "/")) return false;
  // A sibling with a more specific href wins (e.g. /dashboard/audit/mine
  // must not also highlight /dashboard/audit).
  return !items.some(
    (i) =>
      i.href !== href &&
      i.href.length > href.length &&
      (pathname === i.href || pathname.startsWith(i.href + "/")),
  );
}

// The group whose route is currently active — always forced open.
function activeGroupLabel(
  pathname: string,
  groups: typeof navGroups,
): string | null {
  for (const group of groups) {
    if (group.items.some((item) => isActive(pathname, item.href, group.items))) {
      return group.label;
    }
  }
  return null;
}

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { can, loading } = usePermissions();

  // RBAC-filtered nav: items with no permission are always visible; while
  // permissions load we keep the full structure (rendered as skeletons below)
  // so nothing flashes in and then disappears.
  const filteredNavGroups = useMemo(() => {
    if (loading) return navGroups;
    return navGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) =>
          item.anyOfPermissions
            ? item.anyOfPermissions.some((p) => can(p))
            : !item.permission || can(item.permission),
        ),
      }))
      .filter((group) => group.items.length > 0);
  }, [can, loading]);

  // Deterministic initial state (server + first client render): only the
  // section containing the active route is open. A cookie sync runs after mount.
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    const active = activeGroupLabel(pathname, navGroups);
    return new Set(active ? [active] : []);
  });

  // Hydrate persisted open/closed state from cookie, then always force the
  // active group open so the user can see where they are.
  useEffect(() => {
    const match = document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${GROUPS_COOKIE_NAME}=`));
    const active = activeGroupLabel(pathname, filteredNavGroups);
    setOpenGroups((prev) => {
      const next = match
        ? new Set(
            decodeURIComponent(match.split("=")[1])
              .split(",")
              .filter(Boolean),
          )
        : new Set(prev);
      if (active) next.add(active);
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, filteredNavGroups]);

  function toggleGroup(label: string, open: boolean) {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (open) next.add(label);
      else next.delete(label);
      document.cookie = `${GROUPS_COOKIE_NAME}=${encodeURIComponent(
        [...next].join(","),
      )}; path=/; max-age=${GROUPS_COOKIE_MAX_AGE}`;
      return next;
    });
  }

  async function handleLogout() {
    await logoutAction();
    router.push("/login");
  }

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border px-4 py-3">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image
            src="/long_logo_dark.svg"
            alt="OurNigeria"
            width={140}
            height={39}
            className="hidden dark:block"
          />
          <Image
            src="/long_logo_dark.svg"
            alt="OurNigeria"
            width={140}
            height={39}
            className="block brightness-0 dark:hidden"
          />
          <span className="text-xs text-muted-foreground font-medium bg-muted px-1.5 py-0.5 rounded">
            Admin
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {/* Pinned home link */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === overviewItem.href}
                >
                  <Link href={overviewItem.href}>
                    <overviewItem.icon className="h-4 w-4" />
                    <span>{overviewItem.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {loading
          ? // Skeleton placeholders while permissions load — mirrors the nav
            // structure without flashing items the admin may not hold.
            navGroups.map((group) => (
              <SidebarGroup key={group.label}>
                <SidebarGroupLabel className="pr-1">
                  <Skeleton className="h-3 w-24" />
                </SidebarGroupLabel>
                {openGroups.has(group.label) && (
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {group.items.map((item) => (
                        <SidebarMenuItem key={item.href}>
                          <div className="flex h-8 items-center gap-2 px-2">
                            <Skeleton className="h-4 w-4 rounded-sm" />
                            <Skeleton className="h-3.5 w-28" />
                          </div>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                )}
              </SidebarGroup>
            ))
          : filteredNavGroups.map((group) => {
              const isOpen = openGroups.has(group.label);
              return (
                <Collapsible.Root
                  key={group.label}
                  open={isOpen}
                  onOpenChange={(open) => toggleGroup(group.label, open)}
                  asChild
                >
                  <SidebarGroup>
                    <Collapsible.Trigger asChild>
                      <SidebarGroupLabel className="cursor-pointer select-none pr-1 hover:text-sidebar-foreground">
                        <span className="flex-1">{group.label}</span>
                        <ChevronRight
                          className={`size-3.5 shrink-0 transition-transform duration-200 ${
                            isOpen ? "rotate-90" : ""
                          }`}
                        />
                      </SidebarGroupLabel>
                    </Collapsible.Trigger>
                    <Collapsible.Content>
                      <SidebarGroupContent>
                        <SidebarMenu>
                          {group.items.map((item) => (
                            <SidebarMenuItem key={item.href}>
                              <SidebarMenuButton
                                asChild
                                isActive={isActive(
                                  pathname,
                                  item.href,
                                  group.items,
                                )}
                              >
                                <Link href={item.href}>
                                  <item.icon className="h-4 w-4" />
                                  <span>{item.title}</span>
                                </Link>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          ))}
                        </SidebarMenu>
                      </SidebarGroupContent>
                    </Collapsible.Content>
                  </SidebarGroup>
                </Collapsible.Root>
              );
            })}
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              <span>Log out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
