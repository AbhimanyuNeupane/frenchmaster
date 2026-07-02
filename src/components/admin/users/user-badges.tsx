import { Badge } from "@/components/ui/badge";
import type { UserRole } from "@/types/auth";
import type { UserStatus } from "@/types/admin";

const ROLE_VARIANT: Record<UserRole, React.ComponentProps<typeof Badge>["variant"]> = {
  ADMIN: "accent",
  MODERATOR: "warning",
  PREMIUM: "default",
  USER: "outline",
};

const STATUS_VARIANT: Record<UserStatus, React.ComponentProps<typeof Badge>["variant"]> = {
  ACTIVE: "success",
  SUSPENDED: "warning",
  BANNED: "danger",
};

export function RoleBadge({ role }: { role: UserRole }) {
  return <Badge variant={ROLE_VARIANT[role]}>{role}</Badge>;
}

export function StatusBadge({ status }: { status: UserStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{status}</Badge>;
}
