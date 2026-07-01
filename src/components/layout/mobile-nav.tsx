"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { GraduationCap, Menu, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { primaryNav, secondaryNav, utilityNav } from "@/lib/nav";

export function MobileNav() {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

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
          <Dialog.Title className="sr-only">Navigation</Dialog.Title>
          <div className="mb-6 flex items-center justify-between px-2">
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-xl bg-accent text-white">
                <GraduationCap className="size-5" strokeWidth={2.25} />
              </span>
              <span className="text-[15px] font-bold tracking-tight text-white">
                FrenchMaster
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
              {primaryNav.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
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
              {[...secondaryNav, ...utilityNav].map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
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
          </nav>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
