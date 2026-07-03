"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Layers } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Two-item sub-nav ("Lessons" | "Courses") shown at the top of both the
 * lesson-engine lessons and courses admin views, so admins can switch between
 * the two content domains. Deliberately minimal — a pair of pill links, not a
 * full tab system.
 */
const ITEMS = [
  { href: "/admin/lesson-engine", label: "Lessons", icon: Layers },
  { href: "/admin/lesson-engine/courses", label: "Courses", icon: BookOpen },
] as const;

export function EngineSubnav() {
  const pathname = usePathname();

  function isActive(href: string): boolean {
    if (href === "/admin/lesson-engine") {
      // Exact match (or lesson new/[id] pages) — but NOT the /courses subtree.
      return pathname === href || (pathname.startsWith(`${href}/`) && !pathname.startsWith(`${href}/courses`));
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <div className="inline-flex items-center gap-1 rounded-xl border border-border bg-card p-1">
      {ITEMS.map((item) => {
        const active = isActive(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-accent text-white shadow-sm"
                : "text-muted-foreground hover:bg-secondary/60 hover:text-navy"
            )}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
