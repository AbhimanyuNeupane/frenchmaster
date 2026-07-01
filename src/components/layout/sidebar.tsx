"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { GraduationCap } from "lucide-react";

import { cn } from "@/lib/utils";
import { primaryNav, secondaryNav, utilityNav, type NavItem } from "@/lib/nav";
import { Separator } from "@/components/ui/separator";

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
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
          layoutId="sidebar-active-pill"
          className="absolute inset-0 rounded-xl bg-sidebar-active"
          transition={{ type: "spring", stiffness: 500, damping: 40 }}
        />
      )}
      <Icon className="relative z-10 size-[18px] shrink-0" strokeWidth={2} />
      <span className="relative z-10 truncate">{item.label}</span>
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-sidebar px-3 py-5 lg:flex">
      <Link
        href="/dashboard"
        className="mb-6 flex items-center gap-2.5 px-2"
      >
        <span className="flex size-9 items-center justify-center rounded-xl bg-accent text-white">
          <GraduationCap className="size-5" strokeWidth={2.25} />
        </span>
        <span className="text-[15px] font-bold tracking-tight text-white">
          FrenchMaster
        </span>
      </Link>

      <nav className="flex flex-1 flex-col gap-6 overflow-y-auto pb-4">
        <div className="flex flex-col gap-1">
          {primaryNav.map((item) => (
            <NavLink key={item.key} item={item} active={isActive(item.href)} />
          ))}
        </div>

        <div>
          <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-sidebar-muted/70">
            Milestones
          </p>
          <div className="flex flex-col gap-1">
            {secondaryNav.map((item) => (
              <NavLink key={item.key} item={item} active={isActive(item.href)} />
            ))}
          </div>
        </div>
      </nav>

      <Separator className="mb-3 bg-sidebar-border" />

      <div className="flex flex-col gap-1">
        {utilityNav.map((item) => (
          <NavLink key={item.key} item={item} active={isActive(item.href)} />
        ))}
      </div>
    </aside>
  );
}
