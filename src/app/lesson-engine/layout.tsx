import * as React from "react";
import { AppShell } from "@/components/layout/app-shell";
import { LessonEngineProviders } from "./providers";

export const metadata = {
  title: "Courses",
  description: "Card-based courses, published and managed by admins.",
};

/**
 * Reuses the real app chrome (Sidebar + Topbar) so this route feels like a
 * genuine part of FrenchMaster, not a disconnected demo — this is what a
 * learner sees when they click "Courses" in the main sidebar. Deliberately
 * does NOT wrap in `RequireAuth`: both `Sidebar` and `Topbar` already handle
 * an anonymous (`user === null`) visitor gracefully (Sidebar doesn't touch
 * auth at all; Topbar just renders nothing), so this route stays browsable
 * without logging in — anonymous visitors simply see only unlocked content,
 * per the role-gating design in `lessonEngine.service.ts`.
 */
export default function LessonEngineLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LessonEngineProviders>
      <AppShell>{children}</AppShell>
    </LessonEngineProviders>
  );
}
