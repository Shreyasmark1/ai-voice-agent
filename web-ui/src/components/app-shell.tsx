"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  DashboardSquare01Icon,
  Building03Icon,
  WorkflowSquare01Icon,
  PhoneCallIcon,
  FileAudioIcon,
  Calendar03Icon,
  Logout02Icon,
  ArrowLeftDoubleIcon,
  ArrowRightDoubleIcon,
  Menu01Icon,
  XIcon,
} from "@hugeicons/core-free-icons";

const navItems = [
  { label: "Dashboard", href: "/app/dashboard", icon: DashboardSquare01Icon },
  { label: "Businesses", href: "/app/businesses", icon: Building03Icon },
  { label: "Workflows", href: "/app/workflows", icon: WorkflowSquare01Icon },
  { label: "Chat simulator", href: "/app/simulator", icon: PhoneCallIcon },
  { label: "Records", href: "/app/records", icon: FileAudioIcon },
  { label: "Google Calendar", href: "/app/calendar", icon: Calendar03Icon },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeLabel =
    navItems.find((i) => pathname.startsWith(i.href))?.label ?? "";

  return (
    <div className="flex min-h-dvh w-full">
      <SidebarContent
        pathname={pathname}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((v) => !v)}
        className="sticky top-0 hidden h-dvh shrink-0 md:block"
      />

      <div
        className={cn(
          "fixed inset-0 z-40 md:hidden",
          mobileOpen ? "pointer-events-auto" : "pointer-events-none"
        )}
      >
        <div
          className={cn(
            "absolute inset-0 bg-black/50 transition-opacity",
            mobileOpen ? "opacity-100" : "opacity-0"
          )}
          onClick={() => setMobileOpen(false)}
        />
        <div
          className={cn(
            "absolute inset-y-0 left-0 transition-transform duration-200",
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <SidebarContent
            pathname={pathname}
            collapsed={false}
            onToggleCollapse={() => {}}
            onNavigate={() => setMobileOpen(false)}
            className="h-full"
          />
        </div>
      </div>

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between gap-4 border-b border-border px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
              className="md:hidden"
            >
              <HugeiconsIcon
                icon={mobileOpen ? XIcon : Menu01Icon}
                className="size-5"
              />
            </Button>
            <div className="truncate text-sm font-medium text-muted-foreground">
              {activeLabel}
            </div>
          </div>
        </header>
        <div className="flex-1 p-4 sm:p-6">{children}</div>
      </main>
    </div>
  );
}

type SidebarContentProps = {
  pathname: string;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onNavigate?: () => void;
  className?: string;
};

function SidebarContent({
  pathname,
  collapsed,
  onToggleCollapse,
  onNavigate,
  className,
}: SidebarContentProps) {
  return (
    <aside
      className={cn(
        "flex w-60 shrink-0 flex-col border-r border-border bg-card transition-[width] duration-200",
        collapsed && "w-16",
        className
      )}
    >
      <div
        className={cn(
          "flex py-4",
          collapsed ? "justify-center px-0" : "justify-between px-5"
        )}
      >
        <Link
          href="/app/dashboard"
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-2",
            collapsed && "justify-center"
          )}
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <HugeiconsIcon icon={PhoneCallIcon} className="size-4" />
          </span>
          {!collapsed && (
            <span className="text-sm font-semibold tracking-tight">
              Voice Agent
            </span>
          )}
        </Link>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onToggleCollapse}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="hidden md:inline-flex"
        >
          <HugeiconsIcon
            icon={collapsed ? ArrowRightDoubleIcon : ArrowLeftDoubleIcon}
            className="size-4"
          />
        </Button>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3 py-2">
        {navItems.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                collapsed && "justify-center px-0",
                active && "bg-muted text-foreground"
              )}
            >
              <HugeiconsIcon icon={item.icon} className="size-4 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start gap-3",
            collapsed && "justify-center gap-0 px-0"
          )}
          title={collapsed ? "Sign out" : undefined}
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <HugeiconsIcon icon={Logout02Icon} className="size-4 shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </Button>
      </div>
    </aside>
  );
}
