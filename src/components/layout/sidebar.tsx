"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, FileText, ChevronLeft, FolderOpen, Upload, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: { label: string; href: string }[];
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Relaties", href: "/clients", icon: Users },
  {
    label: "Taken",
    href: "/taken",
    icon: ClipboardList,
    children: [
      { label: "Alle taken", href: "/taken" },
      { label: "BTW Maand", href: "/taken/btw-maand" },
      { label: "BTW Kwartaal", href: "/taken/btw-kwartaal" },
      { label: "VPB", href: "/taken/vpb" },
      { label: "IB", href: "/taken/ib" },
      { label: "Lonen", href: "/taken/lonen" },
    ],
  },
  { label: "Sjablonen", href: "/templates", icon: FileText },
  { label: "Importeren", href: "/import", icon: Upload },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "flex h-screen flex-col border-r border-border bg-sidebar text-sidebar-foreground transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-border px-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <FolderOpen className="h-4 w-4" />
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="text-sm font-semibold">DossierDesk</span>
            <span className="text-xs text-muted-foreground">Practice Management</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <div key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>

              {/* Sub-navigation */}
              {!collapsed && item.children && isActive && (
                <div className="ml-7 mt-0.5 space-y-0.5">
                  {item.children.map((child) => {
                    const isChildActive = pathname === child.href;
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          "block rounded-md px-3 py-1.5 text-xs transition-colors",
                          isChildActive
                            ? "bg-sidebar-accent/50 font-medium text-sidebar-primary"
                            : "text-muted-foreground hover:bg-sidebar-accent/30 hover:text-sidebar-foreground"
                        )}
                      >
                        {child.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-border p-3">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center justify-center rounded-lg p-2 text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          <ChevronLeft
            className={cn(
              "h-4 w-4 transition-transform",
              collapsed && "rotate-180"
            )}
          />
        </button>
      </div>
    </aside>
  );
}
