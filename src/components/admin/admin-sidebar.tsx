"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { ShieldCheck, ArrowLeft } from "lucide-react";

import { cn } from "@/lib/utils";
import { adminNav, adminComingSoon, isAdminNavActive, type AdminNavItem } from "@/lib/admin-nav";
import { Separator } from "@/components/ui/separator";

function NavLink({ item, active }: { item: AdminNavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-150",
        active
          ? "text-white"
          : "text-sidebar-muted hover:bg-white/5 hover:text-sidebar-foreground"
      )}
    >
      {active && (
        <motion.span
          layoutId="admin-sidebar-active-pill"
          className="absolute inset-0 rounded-xl bg-sidebar-active"
          transition={{ type: "spring", stiffness: 500, damping: 40 }}
        />
      )}
      <Icon className="relative z-10 size-[18px] shrink-0" strokeWidth={2} />
      <span className="relative z-10 truncate">{item.label}</span>
    </Link>
  );
}

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-sidebar px-3 py-5 lg:flex">
      <Link href="/admin" className="mb-6 flex items-center gap-2.5 px-2">
        <span className="flex size-9 items-center justify-center rounded-xl bg-accent text-white">
          <ShieldCheck className="size-5" strokeWidth={2.25} />
        </span>
        <span className="flex flex-col leading-none">
          <span className="text-[15px] font-bold tracking-tight text-white">FrenchMaster</span>
          <span className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-sidebar-muted">
            Admin Console
          </span>
        </span>
      </Link>

      <nav className="flex flex-1 flex-col gap-6 overflow-y-auto pb-4">
        <div className="flex flex-col gap-1">
          {adminNav.map((item) => (
            <NavLink key={item.key} item={item} active={isAdminNavActive(pathname, item)} />
          ))}
        </div>

        <div>
          <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-sidebar-muted/70">
            More
          </p>
          <div className="flex flex-col gap-1">
            {adminComingSoon.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.key}
                  aria-disabled
                  className="flex cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-muted/50"
                >
                  <Icon className="size-[18px] shrink-0" strokeWidth={2} />
                  <span className="truncate">{item.label}</span>
                  <span className="ml-auto rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sidebar-muted/70">
                    Soon
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </nav>

      <Separator className="mb-3 bg-sidebar-border" />

      <Link
        href="/dashboard"
        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-muted transition-colors hover:bg-white/5 hover:text-sidebar-foreground"
      >
        <ArrowLeft className="size-[18px] shrink-0" strokeWidth={2} />
        <span className="truncate">Back to App</span>
      </Link>
    </aside>
  );
}
