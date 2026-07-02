import { Loader2, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";

export function PageLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader2 className="size-6 animate-spin text-accent" />
    </div>
  );
}

export function PageError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-danger/10 text-danger">
        <TriangleAlert className="size-7" strokeWidth={2} />
      </div>
      <p className="text-sm font-semibold text-navy">Something went wrong</p>
      <p className="max-w-sm text-sm text-muted-foreground">{message}</p>
      <Button variant="outline" size="sm" onClick={onRetry} className="mt-2">
        Try again
      </Button>
    </div>
  );
}
