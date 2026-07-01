import Link from "next/link";
import { ArrowRight, TriangleAlert } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { WeakTopic } from "@/types";

const SKILL_LABEL: Record<WeakTopic["skill"], string> = {
  pronunciation: "Pronunciation",
  grammar: "Grammar",
  listening: "Listening",
  reading: "Reading",
  speaking: "Speaking",
  vocabulary: "Vocabulary",
};

export function WeakTopicsCard({ topics }: { topics: WeakTopic[] }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Weak Topics</CardTitle>
        <Link
          href="/practice"
          className="flex items-center gap-1 text-xs font-semibold text-accent hover:text-accent-hover"
        >
          Review all
          <ArrowRight className="size-3.5" />
        </Link>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {topics.map((topic) => (
          <div
            key={topic.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-border p-3.5"
          >
            <div className="flex min-w-0 items-start gap-3">
              <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-warning/10 text-warning">
                <TriangleAlert className="size-4" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-navy">{topic.title}</p>
                <div className="mt-1 flex items-center gap-2">
                  <Badge variant="outline">{SKILL_LABEL[topic.skill]}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {topic.accuracy}% accuracy · {topic.mistakeCount} mistakes
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
