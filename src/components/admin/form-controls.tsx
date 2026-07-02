import * as React from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Styled native <select>. We use a native control (rather than a Radix
 * popover) because the admin forms have many simple enum fields and native
 * selects are the most accessible/keyboard-friendly option for that. Styled
 * to visually match the shared <Input>.
 */
function AdminSelect({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <div className="relative">
      <select
        className={cn(
          "flex h-11 w-full appearance-none rounded-xl border border-border bg-card px-4 pr-10 text-sm text-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}

/** Styled native <textarea> matching the shared <Input>. */
function AdminTextarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "flex min-h-[84px] w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

export { AdminSelect, AdminTextarea };
