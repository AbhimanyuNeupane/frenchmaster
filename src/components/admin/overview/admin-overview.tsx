"use client";

import Link from "next/link";
import { Users, UserPlus, CalendarClock, Activity, Library, ArrowRight } from "lucide-react";

import { Reveal } from "@/components/layout/reveal";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card } from "@/components/ui/card";
import { PageError, PageLoading } from "@/components/layout/page-state";
import { useApiQuery } from "@/hooks/use-api-query";
import type { AnalyticsOverview } from "@/types/admin";

function QuickLink({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link href={href} className="group">
      <Card className="flex items-center justify-between gap-4 p-5 transition-colors hover:border-navy/20">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-navy">{title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        </div>
        <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-accent" />
      </Card>
    </Link>
  );
}

export function AdminOverview() {
  const { data, isLoading, error, refetch } =
    useApiQuery<AnalyticsOverview>("/api/admin/analytics/overview");

  if (isLoading) return <PageLoading />;
  if (error || !data) return <PageError message={error ?? "No data returned."} onRetry={refetch} />;

  const numberFmt = new Intl.NumberFormat("en-US");

  return (
    <div className="flex flex-col gap-6 pb-10">
      <Reveal>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-navy sm:text-3xl">Overview</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Platform health at a glance — users, growth, and content.
          </p>
        </div>
      </Reveal>

      <Reveal delay={0.05}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            icon={Users}
            label="Total users"
            value={numberFmt.format(data.totalUsers)}
            tone="navy"
          />
          <StatCard
            icon={Activity}
            label="Active (last 7 days)"
            value={numberFmt.format(data.activeUsersLast7Days)}
            hint="Users with activity this week"
            tone="success"
          />
          <StatCard
            icon={UserPlus}
            label="New users (7 days)"
            value={numberFmt.format(data.newUsersLast7Days)}
            tone="accent"
          />
          <StatCard
            icon={CalendarClock}
            label="New users (30 days)"
            value={numberFmt.format(data.newUsersLast30Days)}
            tone="warning"
          />
          <StatCard
            icon={Library}
            label="Vocabulary words"
            value={numberFmt.format(data.vocabularyWordCount)}
            hint="Active catalog entries"
            tone="navy"
          />
        </div>
      </Reveal>

      <Reveal delay={0.1}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <QuickLink
            href="/admin/users"
            title="Manage users"
            description="Search, filter, and update roles, status, and levels."
          />
          <QuickLink
            href="/admin/vocabulary"
            title="Manage vocabulary"
            description="Author, edit, and remove catalog words."
          />
        </div>
      </Reveal>
    </div>
  );
}
