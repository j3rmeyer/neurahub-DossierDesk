"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, LogOut, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const BREADCRUMB_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  clients: "Relaties",
  templates: "Sjablonen",
  entities: "Entiteiten",
  settings: "Instellingen",
  taken: "Taken",
  import: "Importeren",
};

interface TopbarProps {
  userName?: string;
}

export function Topbar({ userName }: TopbarProps) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  const initials = userName
    ? userName
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-background px-6">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-sm">
        {segments.map((segment, index) => {
          const href = "/" + segments.slice(0, index + 1).join("/");
          const isLast = index === segments.length - 1;
          const label =
            BREADCRUMB_LABELS[segment] || decodeURIComponent(segment);

          return (
            <div key={href} className="flex items-center gap-1.5">
              {index > 0 && (
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              )}
              {isLast ? (
                <span className="font-medium text-foreground">{label}</span>
              ) : (
                <Link
                  href={href}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {label}
                </Link>
              )}
            </div>
          );
        })}
      </nav>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Zoeken... (⌘K)"
            className="w-64 pl-9"
          />
        </div>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
              {initials}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <a href="/auth/logout">
                <LogOut className="mr-2 h-4 w-4" />
                Uitloggen
              </a>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
