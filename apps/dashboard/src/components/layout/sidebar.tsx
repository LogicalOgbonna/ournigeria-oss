"use client";

import { useEffect, useState } from "react";
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
  Bell,
  ClipboardList,
  Megaphone,
  ShieldCheck,
  Heart,
  MessageCircle,
  Hash,
  Activity,
  Filter,
  Sparkles,
  Upload,
  ChevronRight,
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
import { logoutAction } from "@/app/login/actions";

// Pinned, ungrouped home link rendered above all collapsible sections.
const overviewItem = {
  title: "Overview",
  href: "/dashboard",
  icon: LayoutDashboard,
};

const communityNav = [
  { title: "Users", href: "/dashboard/users", icon: Users },
  {
    title: "Conversations",
    href: "/dashboard/conversations",
    icon: MessageSquare,
  },
  { title: "Proposals", href: "/dashboard/proposals", icon: MessageSquare },
  { title: "Feedback", href: "/dashboard/feedback", icon: MessageSquare },
  { title: "Donations", href: "/dashboard/donations", icon: Heart },
];

const socialNav = [
  { title: "Reply Queue", href: "/dashboard/social", icon: MessageCircle },
  { title: "Topics", href: "/dashboard/social/topics", icon: Hash },
  { title: "Sessions", href: "/dashboard/social/sessions", icon: Activity },
  { title: "Funnel", href: "/dashboard/social/funnel", icon: Filter },
  { title: "Analytics", href: "/dashboard/social/analytics", icon: BarChart3 },
];

const knowledgeNav = [
  { title: "Documents", href: "/dashboard/documents", icon: FolderOpen },
  { title: "Coverage", href: "/dashboard/documents/coverage", icon: Map },
  { title: "Enrichment", href: "/dashboard/enrichment", icon: Sparkles },
  { title: "Imports", href: "/dashboard/imports", icon: Upload },
  { title: "Pipelines", href: "/dashboard/ingestion", icon: Database },
  { title: "S3 Files", href: "/dashboard/ingestion/files", icon: FolderOpen },
  { title: "New Run", href: "/dashboard/ingestion/new", icon: Plus },
  { title: "History", href: "/dashboard/ingestion/history", icon: History },
  { title: "Records", href: "/dashboard/ingestion/records", icon: FileText },
];

const aiEngineNav = [
  { title: "Query Analytics", href: "/dashboard/ai", icon: BarChart3 },
  { title: "Citations", href: "/dashboard/ai/citations", icon: FileSearch },
  { title: "Agent Config", href: "/dashboard/ai/agents", icon: Bot },
  { title: "Test Query", href: "/dashboard/ai/test", icon: FlaskConical },
  { title: "Embeddings", href: "/dashboard/vectors", icon: Boxes },
  {
    title: "Similarity Search",
    href: "/dashboard/vectors/search",
    icon: Search,
  },
  {
    title: "Evaluation",
    href: "/dashboard/vectors/evaluation",
    icon: FlaskConical,
  },
];

const notificationNav = [
  { title: "Notifications", href: "/dashboard/notifications", icon: Bell },
  {
    title: "Banners",
    href: "/dashboard/notifications/banners",
    icon: Megaphone,
  },
  { title: "Alerts", href: "/dashboard/alerts", icon: Bell },
];

const systemNav = [
  { title: "Health", href: "/dashboard/system", icon: Server },
  { title: "Live Logs", href: "/dashboard/system/logs", icon: ScrollText },
  { title: "Jobs", href: "/dashboard/system/jobs", icon: Briefcase },
  { title: "Settings", href: "/dashboard/settings", icon: Settings },
];

const adminNav = [
  { title: "Admin Users", href: "/dashboard/admins", icon: ShieldCheck },
  { title: "Audit Log", href: "/dashboard/audit", icon: ClipboardList },
];

const navGroups = [
  { label: "Community", items: communityNav },
  { label: "Social", items: socialNav },
  { label: "Knowledge Base", items: knowledgeNav },
  { label: "AI Engine", items: aiEngineNav },
  { label: "Notifications", items: notificationNav },
  { label: "System", items: systemNav },
  { label: "Admin", items: adminNav },
];

const GROUPS_COOKIE_NAME = "dashboard_sidebar_groups";
const GROUPS_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

function isActive(pathname: string, href: string, items: typeof communityNav) {
  if (href === "/dashboard") return pathname === "/dashboard";
  // For top-level section links, only exact match
  const isTopLevel = items.some(
    (i) => i.href === href && items.indexOf(i) === 0,
  );
  if (isTopLevel && items.length > 1) {
    // Check if any sub-item has a more specific match
    const hasMoreSpecific = items.some(
      (i) => i.href !== href && pathname.startsWith(i.href),
    );
    if (hasMoreSpecific) return pathname === href;
  }
  return pathname.startsWith(href);
}

// The group whose route is currently active — always forced open.
function activeGroupLabel(pathname: string): string | null {
  for (const group of navGroups) {
    if (group.items.some((item) => isActive(pathname, item.href, group.items))) {
      return group.label;
    }
  }
  return null;
}

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  // Deterministic initial state (server + first client render): only the
  // section containing the active route is open. A cookie sync runs after mount.
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    const active = activeGroupLabel(pathname);
    return new Set(active ? [active] : []);
  });

  // Hydrate persisted open/closed state from cookie, then always force the
  // active group open so the user can see where they are.
  useEffect(() => {
    const match = document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${GROUPS_COOKIE_NAME}=`));
    const active = activeGroupLabel(pathname);
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
  }, [pathname]);

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

        {navGroups.map((group) => {
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
