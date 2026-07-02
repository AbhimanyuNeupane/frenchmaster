"use client";

import { Clock, Flame, Mic, Sparkles } from "lucide-react";

import { Reveal } from "@/components/layout/reveal";
import { PageError, PageLoading } from "@/components/layout/page-state";
import { WelcomeHeader } from "@/components/dashboard/welcome-header";
import { ContinueLearningCard } from "@/components/dashboard/continue-learning-card";
import { DailyGoalCard } from "@/components/dashboard/daily-goal-card";
import { TodaysLessonCard } from "@/components/dashboard/todays-lesson-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { SkillScoresCard } from "@/components/dashboard/skill-scores-card";
import { WeakTopicsCard } from "@/components/dashboard/weak-topics-card";
import { AchievementsCard } from "@/components/dashboard/achievements-card";
import { UpcomingExamCard } from "@/components/dashboard/upcoming-exam-card";
import { useApiQuery } from "@/hooks/use-api-query";
import type { DashboardData } from "@/types";

export default function DashboardPage() {
  const { data, isLoading, error, refetch } = useApiQuery<DashboardData>("/api/dashboard");

  if (isLoading) return <PageLoading />;
  if (error || !data) return <PageError message={error ?? "No data returned."} onRetry={refetch} />;

  const pronunciationScore = data.skillScores.find((s) => s.key === "pronunciation")?.score ?? 0;

  return (
    <div className="flex flex-col gap-6 pb-10">
      <Reveal>
        <WelcomeHeader user={data.user} />
      </Reveal>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Reveal delay={0.05} className="lg:col-span-2">
          <ContinueLearningCard lesson={data.continueLesson} />
        </Reveal>
        <Reveal delay={0.1}>
          <DailyGoalCard streak={data.streak} />
        </Reveal>
      </div>

      <Reveal delay={0.12}>
        <TodaysLessonCard lesson={data.todaysLesson} />
      </Reveal>

      <Reveal delay={0.15}>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard
            icon={Sparkles}
            label="Total XP"
            value={data.xp.total.toLocaleString()}
            hint={`+${data.xp.todayEarned} today`}
            tone="accent"
          />
          <StatCard
            icon={Flame}
            label="Day Streak"
            value={`${data.streak.current}`}
            hint={`Best: ${data.streak.longest}`}
            tone="warning"
          />
          <StatCard
            icon={Mic}
            label="Pronunciation"
            value={`${pronunciationScore}%`}
            hint="Last 30 days"
            tone="navy"
          />
          <StatCard
            icon={Clock}
            label="Study Time"
            value={`${Math.round(data.studyTimeMinutesThisWeek / 60)}h ${data.studyTimeMinutesThisWeek % 60}m`}
            hint="This week"
            tone="success"
          />
        </div>
      </Reveal>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Reveal delay={0.2} className="lg:col-span-2">
          <SkillScoresCard scores={data.skillScores} />
        </Reveal>
        <Reveal delay={0.25}>
          {data.upcomingExam ? (
            <UpcomingExamCard exam={data.upcomingExam} />
          ) : null}
        </Reveal>
      </div>

      <Reveal delay={0.3}>
        <WeakTopicsCard topics={data.weakTopics} />
      </Reveal>

      <Reveal delay={0.35}>
        <AchievementsCard achievements={data.achievements} />
      </Reveal>
    </div>
  );
}
