import type { LucideIcon } from "lucide-react";

export function ComingSoon({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card px-6 py-20 text-center animate-fade-in">
      <div className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-accent/10 text-accent">
        <Icon className="size-7" strokeWidth={2} />
      </div>
      <h1 className="text-xl font-bold tracking-tight text-navy">{title}</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
