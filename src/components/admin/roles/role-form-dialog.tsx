"use client";

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/auth-context";
import { useApiQuery } from "@/hooks/use-api-query";
import { ApiRequestError } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type {
  AdminPermission,
  AdminRole,
  CreateRolePayload,
  UpdateRolePayload,
} from "@/types/admin";

interface FormState {
  id: string;
  name: string;
  description: string;
  rank: string; // kept as string for the number input; parsed on submit
  permissionKeys: Set<string>;
}

const EMPTY_FORM: FormState = {
  id: "",
  name: "",
  description: "",
  rank: "0",
  permissionKeys: new Set(),
};

function toFormState(role: AdminRole): FormState {
  return {
    id: role.id,
    name: role.name,
    description: role.description ?? "",
    rank: String(role.rank),
    permissionKeys: new Set(role.permissionKeys),
  };
}

export function RoleFormDialog({
  role,
  open,
  onOpenChange,
  onSaved,
}: {
  role: AdminRole | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const { authedFetch } = useAuth();
  const isEditing = role !== null;
  const { data: permissions } = useApiQuery<AdminPermission[]>("/api/admin/permissions");

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [synced, setSynced] = useState(false);

  if (open && !synced) {
    setSynced(true);
    setForm(role ? toFormState(role) : EMPTY_FORM);
    setError(null);
  } else if (!open && synced) {
    setSynced(false);
  }

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function togglePermission(key: string) {
    setForm((prev) => {
      const next = new Set(prev.permissionKeys);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return { ...prev, permissionKeys: next };
    });
  }

  const permissionsByCategory = useMemo(() => {
    const map = new Map<string, AdminPermission[]>();
    for (const p of permissions ?? []) {
      const list = map.get(p.category) ?? [];
      list.push(p);
      map.set(p.category, list);
    }
    return map;
  }, [permissions]);

  function validate(): string | null {
    if (!isEditing) {
      const id = form.id.trim().toLowerCase();
      if (!id) return "Role id is required.";
      if (!/^[a-z0-9_]+$/.test(id)) {
        return "Id must be lowercase letters, numbers, underscore only.";
      }
    }
    if (!form.name.trim()) return "Name is required.";
    if (!Number.isInteger(Number(form.rank))) return "Rank must be a whole number.";
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      if (isEditing) {
        const payload: UpdateRolePayload = {
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          rank: Number(form.rank),
          permissionKeys: Array.from(form.permissionKeys),
        };
        await authedFetch(`/api/admin/roles/${role!.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        const payload: CreateRolePayload = {
          id: form.id.trim().toLowerCase(),
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          rank: Number(form.rank),
          permissionKeys: Array.from(form.permissionKeys),
        };
        await authedFetch("/api/admin/roles", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      onSaved();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to save role.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !saving && onOpenChange(next)}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit role" : "Add role"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update this role's details and the permissions it grants."
              : "Create a custom role and choose the permissions it grants."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <Label htmlFor="role-id">Id</Label>
            <Input
              id="role-id"
              value={form.id}
              onChange={(e) => set("id", e.target.value)}
              placeholder="course_creator"
              disabled={saving || isEditing}
            />
            <p className="mt-1.5 text-xs text-muted-foreground">
              {isEditing
                ? "The id is permanent and can't be changed."
                : "Lowercase letters, numbers, underscore only. Permanent once created."}
            </p>
          </div>

          <div>
            <Label htmlFor="role-name">Name</Label>
            <Input
              id="role-name"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Course Creator"
              disabled={saving}
            />
          </div>

          <div>
            <Label htmlFor="role-description">Description</Label>
            <Input
              id="role-description"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Authors lessons and courses."
              disabled={saving}
            />
          </div>

          <div>
            <Label htmlFor="role-rank">Rank</Label>
            <Input
              id="role-rank"
              type="number"
              value={form.rank}
              onChange={(e) => set("rank", e.target.value)}
              disabled={saving}
            />
            <p className="mt-1.5 text-xs text-muted-foreground">
              Display/sort order only — higher ranks are listed first. Not used to decide access.
            </p>
          </div>

          <div>
            <Label>Permissions</Label>
            <div className="mt-1.5 flex flex-col gap-3 rounded-xl border border-border p-3">
              {permissions === null ? (
                <div className="flex items-center justify-center py-6 text-muted-foreground">
                  <Loader2 className="size-5 animate-spin" />
                </div>
              ) : (
                Array.from(permissionsByCategory.entries()).map(([category, items]) => (
                  <div key={category}>
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {category}
                    </p>
                    <div className="flex flex-col gap-1.5">
                      {items.map((p) => (
                        <label
                          key={p.key}
                          className={cn(
                            "flex cursor-pointer items-start gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-secondary/60",
                            saving && "pointer-events-none opacity-50"
                          )}
                        >
                          <input
                            type="checkbox"
                            className="mt-0.5 size-4 rounded border-border"
                            checked={form.permissionKeys.has(p.key)}
                            onChange={() => togglePermission(p.key)}
                            disabled={saving}
                          />
                          <span>
                            <span className="font-medium text-navy">{p.key}</span>
                            {p.description && (
                              <span className="block text-xs text-muted-foreground">
                                {p.description}
                              </span>
                            )}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <div className="mt-1 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" variant="accent" size="sm" disabled={saving}>
              {saving && <Loader2 className="size-4 animate-spin" />}
              {isEditing ? "Save changes" : "Add role"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
