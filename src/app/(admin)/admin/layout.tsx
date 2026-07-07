import type { ReactNode } from "react";

import { AdminShell } from "@/components/admin/admin-shell";
import { RequirePermission } from "@/components/auth/require-permission";

export default function AdminGroupLayout({ children }: { children: ReactNode }) {
  return (
    <RequirePermission permissions={["admin.access"]}>
      <AdminShell>{children}</AdminShell>
    </RequirePermission>
  );
}
