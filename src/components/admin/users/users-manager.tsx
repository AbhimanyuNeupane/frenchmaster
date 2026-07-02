"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Loader2, Users as UsersIcon, Pencil } from "lucide-react";

import { Reveal } from "@/components/layout/reveal";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PageError } from "@/components/layout/page-state";
import { AdminSelect } from "@/components/admin/form-controls";
import { PaginationControls } from "@/components/admin/pagination-controls";
import { RoleBadge, StatusBadge } from "@/components/admin/users/user-badges";
import { UserEditDialog } from "@/components/admin/users/user-edit-dialog";
import { useApiQuery } from "@/hooks/use-api-query";
import { useAuth } from "@/contexts/auth-context";
import type { UserRole } from "@/types/auth";
import type { AdminUser, AdminUserListResponse, UserStatus } from "@/types/admin";

const PAGE_SIZE = 20;
const ROLE_OPTIONS: UserRole[] = ["ADMIN", "MODERATOR", "PREMIUM", "USER"];
const STATUS_OPTIONS: UserStatus[] = ["ACTIVE", "SUSPENDED", "BANNED"];

function initialsOf(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function UsersManager() {
  const { user: currentUser } = useAuth();

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<UserRole | "all">("all");
  const [status, setStatus] = useState<UserStatus | "all">("all");
  const [page, setPage] = useState(1);

  const [activeUser, setActiveUser] = useState<AdminUser | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Debounce the search box so we don't fire a request on every keystroke.
  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const path = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("pageSize", String(PAGE_SIZE));
    if (search) params.set("search", search);
    if (role !== "all") params.set("role", role);
    if (status !== "all") params.set("status", status);
    return `/api/admin/users?${params.toString()}`;
  }, [page, search, role, status]);

  const { data, isLoading, error, refetch } = useApiQuery<AdminUserListResponse>(path, [path]);

  function openEdit(u: AdminUser) {
    setActiveUser(u);
    setDialogOpen(true);
  }

  const users = data?.users ?? [];

  return (
    <div className="flex flex-col gap-6 pb-10">
      <Reveal>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-navy sm:text-3xl">Users</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Search, filter, and manage accounts across the platform.
          </p>
        </div>
      </Reveal>

      <Reveal delay={0.05}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setPage(1);
              }}
              placeholder="Search by name or email..."
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <AdminSelect
              aria-label="Filter by role"
              value={role}
              onChange={(e) => {
                setRole(e.target.value as UserRole | "all");
                setPage(1);
              }}
              className="w-full sm:w-40"
            >
              <option value="all">All roles</option>
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </AdminSelect>
            <AdminSelect
              aria-label="Filter by status"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as UserStatus | "all");
                setPage(1);
              }}
              className="w-full sm:w-40"
            >
              <option value="all">All statuses</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </AdminSelect>
          </div>
        </div>
      </Reveal>

      {error ? (
        <PageError message={error} onRetry={refetch} />
      ) : isLoading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="size-6 animate-spin text-accent" />
        </div>
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <UsersIcon className="size-8 text-muted-foreground" />
          <p className="text-sm font-medium text-navy">No users found</p>
          <p className="text-xs text-muted-foreground">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <Reveal delay={0.1}>
          <div className="flex flex-col gap-3">
            {users.map((u) => {
              const isSelf = currentUser?.id === u.id;
              return (
                <Card
                  key={u.id}
                  className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar className="size-10 shrink-0 border border-border">
                      <AvatarFallback>{initialsOf(u.name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 truncate text-sm font-semibold text-navy">
                        {u.name}
                        {isSelf && (
                          <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                            You
                          </span>
                        )}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        Joined {formatDate(u.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <RoleBadge role={u.role} />
                    <StatusBadge status={u.status} />
                    <span className="rounded-full border border-border px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                      {u.currentLevel}
                    </span>
                    <Button variant="outline" size="sm" onClick={() => openEdit(u)}>
                      <Pencil className="size-3.5" />
                      Edit
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </Reveal>
      )}

      {data && data.users.length > 0 && (
        <PaginationControls
          pagination={data.pagination}
          onPageChange={setPage}
          disabled={isLoading}
        />
      )}

      <UserEditDialog
        user={activeUser}
        isSelf={currentUser?.id === activeUser?.id}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSaved={() => refetch()}
      />
    </div>
  );
}
