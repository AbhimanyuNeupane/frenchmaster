"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { useAuth } from "@/contexts/auth-context";

/** Gates a subtree behind the logged-in user holding ANY of the given permission keys — mirrors the backend's requirePermission middleware. */
export function RequirePermission({
  permissions,
  children,
}: {
  permissions: string[];
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const allowed = user ? permissions.some((key) => user.permissions.includes(key)) : false;

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace("/login");
    } else if (!allowed) {
      router.replace("/dashboard");
    }
  }, [isLoading, user, allowed, router]);

  if (isLoading || !user || !allowed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <Loader2 className="size-6 animate-spin text-accent" />
      </div>
    );
  }

  return <>{children}</>;
}
