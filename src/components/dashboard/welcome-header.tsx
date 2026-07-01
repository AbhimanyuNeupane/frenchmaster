import { Badge } from "@/components/ui/badge";
import type { UserProfile } from "@/types";

export function WelcomeHeader({ user }: { user: UserProfile }) {
  const firstName = user.name.split(" ")[0];

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-navy sm:text-3xl">
          Welcome back, {firstName}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Let&apos;s keep your French moving forward today.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="accent" className="px-3 py-1.5 text-[13px]">
          Level {user.currentLevel}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {user.levelProgress}% to {nextLevel(user.currentLevel)}
        </span>
      </div>
    </div>
  );
}

function nextLevel(level: UserProfile["currentLevel"]) {
  const order = ["A1", "A2", "B1", "B2"] as const;
  const idx = order.indexOf(level);
  return order[idx + 1] ?? "Fluency";
}
