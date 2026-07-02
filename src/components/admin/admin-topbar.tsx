"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { AdminMobileNav } from "@/components/admin/admin-mobile-nav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/auth-context";

export function AdminTopbar() {
  const { user, logout } = useAuth();
  const router = useRouter();

  if (!user) return null;

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-md sm:px-6 lg:pl-6">
      <div className="flex items-center gap-2">
        <AdminMobileNav />
        <Badge variant="accent" className="hidden sm:inline-flex">
          Admin
        </Badge>
      </div>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <Link
          href="/dashboard"
          className="hidden items-center gap-2 rounded-xl border border-border px-3.5 py-2 text-[13px] font-semibold text-navy transition-colors hover:bg-secondary sm:inline-flex"
        >
          <ArrowLeft className="size-4" strokeWidth={2} />
          Back to App
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-accent">
            <Avatar className="size-9 border border-border">
              <AvatarImage src={user.avatarUrl ?? undefined} alt={user.name} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{user.name}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard">Back to App</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/profile">Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={handleLogout}>
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
