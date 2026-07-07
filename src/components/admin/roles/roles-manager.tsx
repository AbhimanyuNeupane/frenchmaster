"use client";

import { useState } from "react";
import { Loader2, ShieldCheck, Plus, Pencil, Trash2, Lock } from "lucide-react";

import { Reveal } from "@/components/layout/reveal";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PageError } from "@/components/layout/page-state";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { RoleFormDialog } from "@/components/admin/roles/role-form-dialog";
import { useApiQuery } from "@/hooks/use-api-query";
import { useAuth } from "@/contexts/auth-context";
import { ApiRequestError } from "@/lib/api-client";
import type { AdminRole } from "@/types/admin";

export function RolesManager() {
  const { authedFetch } = useAuth();

  const { data, isLoading, error, refetch } = useApiQuery<AdminRole[]>("/api/admin/roles");
  const roles = data ?? [];

  const [formOpen, setFormOpen] = useState(false);
  const [activeRole, setActiveRole] = useState<AdminRole | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<AdminRole | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function openCreate() {
    setActiveRole(null);
    setFormOpen(true);
  }

  function openEdit(role: AdminRole) {
    setActiveRole(role);
    setFormOpen(true);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await authedFetch(`/api/admin/roles/${deleteTarget.id}`, { method: "DELETE" });
      setDeleteTarget(null);
      refetch();
    } catch (err) {
      setDeleteError(err instanceof ApiRequestError ? err.message : "Failed to delete role.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 pb-10">
      <Reveal>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-navy sm:text-3xl">
              Roles &amp; Permissions
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Control what each role can access. Changes take effect immediately for anyone holding that role.
            </p>
          </div>
          <Button variant="accent" onClick={openCreate} className="w-full sm:w-auto">
            <Plus className="size-4" />
            Add role
          </Button>
        </div>
      </Reveal>

      {error ? (
        <PageError message={error} onRetry={refetch} />
      ) : isLoading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="size-6 animate-spin text-accent" />
        </div>
      ) : roles.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <ShieldCheck className="size-8 text-muted-foreground" />
          <p className="text-sm font-medium text-navy">No roles yet</p>
          <Button variant="accent" size="sm" onClick={openCreate} className="mt-2">
            <Plus className="size-4" />
            Add role
          </Button>
        </div>
      ) : (
        <Reveal delay={0.05}>
          <div className="flex flex-col gap-3">
            {roles.map((role) => (
              <Card
                key={role.id}
                className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-navy">{role.name}</p>
                    <Badge variant="outline">{role.id}</Badge>
                    {role.isSystem && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                            <Lock className="size-2.5" />
                            System
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          Seeded role — can&apos;t be deleted, but its permissions can be edited.
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                  {role.description && (
                    <p className="mt-1 text-sm text-muted-foreground">{role.description}</p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {role.permissionKeys.length === 0 ? (
                      <span className="text-xs text-muted-foreground">No permissions granted</span>
                    ) : (
                      role.permissionKeys.map((key) => (
                        <span
                          key={key}
                          className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-foreground/70"
                        >
                          {key}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2 sm:justify-end">
                  <Button variant="outline" size="sm" onClick={() => openEdit(role)}>
                    <Pencil className="size-3.5" />
                    Edit
                  </Button>
                  {role.isSystem ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>
                          <Button variant="ghost" size="sm" disabled className="text-danger">
                            <Trash2 className="size-3.5" />
                            Delete
                          </Button>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>System roles can&apos;t be deleted.</TooltipContent>
                    </Tooltip>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setDeleteError(null);
                        setDeleteTarget(role);
                      }}
                      className="text-danger hover:bg-danger/10"
                    >
                      <Trash2 className="size-3.5" />
                      Delete
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </Reveal>
      )}

      <RoleFormDialog
        role={activeRole}
        open={formOpen}
        onOpenChange={setFormOpen}
        onSaved={() => refetch()}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(next) => !next && setDeleteTarget(null)}
        destructive
        loading={deleting}
        title="Delete this role?"
        description={
          deleteError
            ? deleteError
            : `"${deleteTarget?.name}" will be permanently deleted. Any user still holding this role must be reassigned first.`
        }
        confirmLabel="Delete role"
        onConfirm={confirmDelete}
      />
    </div>
  );
}
