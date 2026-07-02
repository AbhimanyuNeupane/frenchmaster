"use client";

import { useState } from "react";
import { Loader2, Info } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AdminSelect } from "@/components/admin/form-controls";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { useAuth } from "@/contexts/auth-context";
import { ApiRequestError } from "@/lib/api-client";
import type { CEFRLevel } from "@/types";
import type { UserRole } from "@/types/auth";
import type { AdminUser, UpdateUserPayload, UserStatus } from "@/types/admin";

const ROLES: UserRole[] = ["ADMIN", "MODERATOR", "PREMIUM", "USER"];
const STATUSES: UserStatus[] = ["ACTIVE", "SUSPENDED", "BANNED"];
const LEVELS: CEFRLevel[] = ["A1", "A2", "B1", "B2"];

export function UserEditDialog({
  user,
  isSelf,
  open,
  onOpenChange,
  onSaved,
}: {
  user: AdminUser | null;
  isSelf: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (updated: AdminUser) => void;
}) {
  const { authedFetch } = useAuth();

  const [role, setRole] = useState<UserRole>("USER");
  const [status, setStatus] = useState<UserStatus>("ACTIVE");
  const [level, setLevel] = useState<CEFRLevel>("A1");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [synced, setSynced] = useState(false);

  // Sync the form to the target user's values once per open. Adjusting state
  // during render (rather than in an effect) is React's recommended pattern
  // for resetting state when a prop changes, and avoids a cascading render.
  if (open && !synced && user) {
    setSynced(true);
    setRole(user.role);
    setStatus(user.status);
    setLevel(user.currentLevel);
    setError(null);
  } else if (!open && synced) {
    setSynced(false);
  }

  if (!user) return null;

  function buildPatch(): UpdateUserPayload {
    const patch: UpdateUserPayload = {};
    // Server forbids an admin changing their own role/status, and the UI
    // disables those controls on the self row — so never include them here.
    if (!isSelf) {
      if (role !== user!.role) patch.role = role;
      if (status !== user!.status) patch.status = status;
    }
    if (level !== user!.currentLevel) patch.currentLevel = level;
    return patch;
  }

  const patch = buildPatch();
  const hasChanges = Object.keys(patch).length > 0;
  const isDestructiveStatus =
    patch.status === "SUSPENDED" || patch.status === "BANNED";

  async function persist(payload: UpdateUserPayload) {
    setSaving(true);
    setError(null);
    try {
      const updated = await authedFetch<AdminUser>(`/api/admin/users/${user!.id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      onSaved(updated);
      setConfirmOpen(false);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to update user.");
      setConfirmOpen(false);
    } finally {
      setSaving(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!hasChanges) {
      onOpenChange(false);
      return;
    }
    // Suspending or banning is destructive — require an explicit confirmation.
    if (isDestructiveStatus) {
      setConfirmOpen(true);
      return;
    }
    void persist(patch);
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(next) => !saving && onOpenChange(next)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit user</DialogTitle>
            <DialogDescription>
              {user.name} · {user.email}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <Label htmlFor="user-role">Role</Label>
              <AdminSelect
                id="user-role"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                disabled={isSelf || saving}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </AdminSelect>
            </div>

            <div>
              <Label htmlFor="user-status">Status</Label>
              <AdminSelect
                id="user-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as UserStatus)}
                disabled={isSelf || saving}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </AdminSelect>
            </div>

            <div>
              <Label htmlFor="user-level">Current level</Label>
              <AdminSelect
                id="user-level"
                value={level}
                onChange={(e) => setLevel(e.target.value as CEFRLevel)}
                disabled={saving}
              >
                {LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </AdminSelect>
            </div>

            {isSelf && (
              <div className="flex items-start gap-2 rounded-xl bg-secondary px-3 py-2.5 text-xs text-muted-foreground">
                <Info className="mt-0.5 size-3.5 shrink-0" />
                <span>
                  You can&apos;t change your own role or status. You can still adjust your level.
                </span>
              </div>
            )}

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
              <Button type="submit" variant="accent" size="sm" disabled={saving || !hasChanges}>
                {saving && <Loader2 className="size-4 animate-spin" />}
                Save changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        destructive
        loading={saving}
        title={patch.status === "BANNED" ? "Ban this user?" : "Suspend this user?"}
        description={
          patch.status === "BANNED"
            ? `${user.name} will be banned and lose access to the platform. You can restore them later by setting their status back to Active.`
            : `${user.name} will be suspended and won't be able to use the platform until reactivated.`
        }
        confirmLabel={patch.status === "BANNED" ? "Ban user" : "Suspend user"}
        onConfirm={() => void persist(patch)}
      />
    </>
  );
}
