import type { ReactNode } from "react";

import { AdminShell } from "@/components/admin/admin-shell";
import { RequireRole } from "@/components/auth/require-role";

export default function AdminGroupLayout({ children }: { children: ReactNode }) {
  return (
    <RequireRole roles={["ADMIN"]}>
      <AdminShell>{children}</AdminShell>
    </RequireRole>
  );
}
