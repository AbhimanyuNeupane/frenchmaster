import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { SkillScore } from "@/types";

const SKILL_HREF: Record<SkillScore["key"], string> = {
  pronunciation: "/speaking",
  grammar: "/grammar",
  listening: "/listening",
  reading: "/reading",
  speaking: "/speaking",
  vocabulary: "/vocabulary",
};

export function SkillScoresCard({ scores }: { scores: SkillScore[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Skill Scores</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {scores.map((skill) => (
          <Link
            key={skill.key}
            href={SKILL_HREF[skill.key]}
            className="group flex flex-col gap-1.5"
          >
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-navy group-hover:text-accent">
                {skill.label}
              </span>
              <span className="text-xs font-semibold text-muted-foreground">
                {skill.score}%
              </span>
            </div>
            <Progress value={skill.score} className="h-2" />
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
