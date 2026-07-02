"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { ShieldCheck, Menu, X, ArrowLeft } from "lucide-react";

import { cn } from "@/lib/utils";
import { adminNav, adminComingSoon, isAdminNavActive } from "@/lib/admin-nav";

export function AdminMobileNav() {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          aria-label="Open navigation"
          className="flex size-10 items-center justify-center rounded-xl text-navy hover:bg-secondary lg:hidden"
        >
          <Menu className="size-5" />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-navy/40 backdrop-blur-sm data-[state=open]:animate-fade-in lg:hidden" />
        <Dialog.Content className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-sidebar px-3 py-5 shadow-2xl data-[state=open]:animate-slide-up lg:hidden">
          <Dialog.Title className="sr-only">Admin navigation</Dialog.Title>
          <div className="mb-6 flex items-center justify-between px-2">
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-xl bg-accent text-white">
                <ShieldCheck className="size-5" strokeWidth={2.25} />
              </span>
              <span className="flex flex-col leading-none">
                <span className="text-[15px] font-bold tracking-tight text-white">FrenchMaster</span>
                <span className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-sidebar-muted">
                  Admin Console
                </span>
              </span>
            </div>
            <Dialog.Close asChild>
              <button
                aria-label="Close navigation"
                className="flex size-8 items-center justify-center rounded-lg text-sidebar-muted hover:bg-white/5"
              >
                <X className="size-4" />
              </button>
            </Dialog.Close>
          </div>

          <nav className="flex flex-1 flex-col gap-6 overflow-y-auto pb-4">
            <div className="flex flex-col gap-1">
              {adminNav.map((item) => {
                const Icon = item.icon;
                const active = isAdminNavActive(pathname, item);
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium",
                      active
                        ? "bg-sidebar-active text-white"
                        : "text-sidebar-muted hover:bg-white/5 hover:text-sidebar-foreground"
                    )}
                  >
                    <Icon className="size-[18px] shrink-0" strokeWidth={2} />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>

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
          </nav>

          <Link
            href="/dashboard"
            onClick={() => setOpen(false)}
            className="mt-3 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-muted hover:bg-white/5 hover:text-sidebar-foreground"
          >
            <ArrowLeft className="size-[18px] shrink-0" strokeWidth={2} />
            <span className="truncate">Back to App</span>
          </Link>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
