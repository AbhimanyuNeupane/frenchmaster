import { Badge } from "@/components/ui/badge";
import type { AdminRole, UserStatus } from "@/types/admin";

const STATUS_VARIANT: Record<UserStatus, React.ComponentProps<typeof Badge>["variant"]> = {
  ACTIVE: "success",
  SUSPENDED: "warning",
  BANNED: "danger",
};

/**
 * Roles are dynamic, admin-managed data (see /admin/roles) — there's no
 * fixed set to hardcode a color per id, so the badge variant is derived from
 * `rank` tiers instead: high-privilege roles read as more prominent,
 * regardless of which specific role (of potentially many) holds that rank.
 */
function variantForRank(rank: number): React.ComponentProps<typeof Badge>["variant"] {
  if (rank >= 80) return "accent";
  if (rank >= 50) return "warning";
  if (rank > 0) return "default";
  return "outline";
}

/** `role` is undefined while the roles catalog is still loading — renders the raw id as a graceful fallback rather than blocking on it. */
export function RoleBadge({ roleId, role }: { roleId: string; role?: AdminRole }) {
  return <Badge variant={role ? variantForRank(role.rank) : "outline"}>{role?.name ?? roleId}</Badge>;
}

export function StatusBadge({ status }: { status: UserStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{status}</Badge>;
}
