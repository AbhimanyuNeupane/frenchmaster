import * as React from "react";
import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { LessonEngineProviders } from "./providers";

export const metadata = {
  title: "Universal Lesson Engine",
  description: "A language-agnostic, card-based lesson player.",
};

/**
 * Minimal, auth-free chrome for the demo. Deliberately does NOT reuse the
 * existing app's AppShell/AdminShell — this route is independent of the
 * FrenchMaster app.
 */
export default function LessonEngineLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LessonEngineProviders>
      <div className="min-h-screen bg-background">
        <header className="border-b border-border">
          <div className="mx-auto flex max-w-4xl items-center gap-2 px-4 py-3">
            <Link
              href="/lesson-engine"
              className="inline-flex items-center gap-2 font-semibold text-foreground"
            >
              <GraduationCap className="h-5 w-5 text-accent" />
              Lesson Engine
            </Link>
            <span className="ml-2 rounded-full bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent">
              demo
            </span>
          </div>
        </header>
        <main className="mx-auto max-w-4xl px-4 py-8">{children}</main>
      </div>
    </LessonEngineProviders>
  );
}
