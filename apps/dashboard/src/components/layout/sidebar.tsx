"use client";

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
  Flag,
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
  Network,
} from "lucide-react";
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

const generalNav = [
  { title: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { title: "Users", href: "/dashboard/users", icon: Users },
  { title: "Feedback", href: "/dashboard/feedback", icon: MessageSquare },
  { title: "Donations", href: "/dashboard/donations", icon: Heart },
];

const conversationNav = [
  {
    title: "All Conversations",
    href: "/dashboard/conversations",
    icon: MessageSquare,
  },
  { title: "Flagged", href: "/dashboard/conversations/flagged", icon: Flag },
];

const aiNav = [
  { title: "Query Analytics", href: "/dashboard/ai", icon: BarChart3 },
  { title: "Citations", href: "/dashboard/ai/citations", icon: FileSearch },
  { title: "Agent Config", href: "/dashboard/ai/agents", icon: Bot },
  { title: "Test Query", href: "/dashboard/ai/test", icon: FlaskConical },
];

const vectorNav = [
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

const graphNav = [
  { title: "Graph Management", href: "/dashboard/graph", icon: Network },
];

const contentNav = [
  { title: "Documents", href: "/dashboard/documents", icon: FolderOpen },
  { title: "Coverage", href: "/dashboard/documents/coverage", icon: Map },
];

const ingestionNav = [
  { title: "Pipelines", href: "/dashboard/ingestion", icon: Database },
  { title: "S3 Files", href: "/dashboard/ingestion/files", icon: FolderOpen },
  { title: "New Run", href: "/dashboard/ingestion/new", icon: Plus },
  { title: "History", href: "/dashboard/ingestion/history", icon: History },
  { title: "Records", href: "/dashboard/ingestion/records", icon: FileText },
];

const systemNav = [
  { title: "Health", href: "/dashboard/system", icon: Server },
  { title: "Settings", href: "/dashboard/settings", icon: Settings },
  { title: "Live Logs", href: "/dashboard/system/logs", icon: ScrollText },
  { title: "Jobs", href: "/dashboard/system/jobs", icon: Briefcase },
];

const notificationNav = [
  { title: "Notifications", href: "/dashboard/notifications", icon: Bell },
  {
    title: "Banners",
    href: "/dashboard/notifications/banners",
    icon: Megaphone,
  },
];

const adminNav = [
  { title: "Admin Users", href: "/dashboard/admins", icon: ShieldCheck },
  { title: "Alerts", href: "/dashboard/alerts", icon: Bell },
  { title: "Audit Log", href: "/dashboard/audit", icon: ClipboardList },
];

const navGroups = [
  { label: "General", items: generalNav },
  { label: "Conversations", items: conversationNav },
  { label: "Notifications", items: notificationNav },
  { label: "AI & RAG", items: aiNav },
  { label: "Vector Store", items: vectorNav },
  { label: "Knowledge Graph", items: graphNav },
  { label: "Content", items: contentNav },
  { label: "Ingestion", items: ingestionNav },
  { label: "System", items: systemNav },
  { label: "Admin", items: adminNav },
];

function isActive(pathname: string, href: string, items: typeof generalNav) {
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

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();

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
        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(pathname, item.href, group.items)}
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
          </SidebarGroup>
        ))}
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
