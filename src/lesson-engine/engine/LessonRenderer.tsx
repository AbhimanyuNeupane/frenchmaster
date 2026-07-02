"use client";

// Importing these barrels once registers every card component and validator via
// their module-scope side effects. The renderer itself references NO concrete
// card type — it only ever asks the registry for a component by `type` string.
import "../cards";

import * as React from "react";
import { AnimatePresence, useAnimationControls, useReducedMotion, motion } from "framer-motion";
import { Loader2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getCardComponent } from "../registry/componentRegistry";
import { validateCard, isValidatingCard } from "../validation";
import { useLesson } from "../hooks/useLesson";
import { useLessonNavigation } from "../navigation/useLessonNavigation";
import { useLessonStore } from "../store/useLessonStore";
import type { LessonCard, ValidationResult } from "../types";
import {
  CardShell,
  EmptyLessonState,
  HeartsDisplay,
  LessonErrorBoundary,
  ProgressBar,
  UnknownCardFallback,
  XpDisplay,
} from "../components";

const XP_CORRECT = 10;
const XP_VIEW = 2;
const MAX_HEARTS = 5;

export interface LessonRendererProps {
  lessonId: string;
  courseId?: string;
  sectionId?: string;
  onExit?: () => void;
}

/**
 * Public entry point of the engine. Orchestration only: load lesson → ask
 * navigation for the current index → resolve the card component from the
 * registry → render it in Suspense + CardShell → wire the card's onSubmit
 * through the validation engine into the store. It contains zero card-specific
 * logic.
 */
export function LessonRenderer(props: LessonRendererProps) {
  const { lessonId, onExit } = props;
  const query = useLesson(lessonId);

  return (
    <LessonErrorBoundary onExit={onExit} onRetry={() => query.refetch()}>
      <RendererInner {...props} />
    </LessonErrorBoundary>
  );
}

function RendererInner({
  lessonId,
  courseId,
  sectionId,
  onExit,
}: LessonRendererProps) {
  const reduce = useReducedMotion();
  const { data: lesson, isLoading, error } = useLesson(lessonId);

  // Throw load errors so the surrounding boundary can render the retry screen.
  if (error) throw error;

  const nav = useLessonNavigation(lesson, { onExit });

  const startLesson = useLessonStore((s) => s.startLesson);
  const markCardCompleted = useLessonStore((s) => s.markCardCompleted);
  const recordCorrect = useLessonStore((s) => s.recordCorrect);
  const recordWrong = useLessonStore((s) => s.recordWrong);
  const addXp = useLessonStore((s) => s.addXp);
  const setQuizScore = useLessonStore((s) => s.setQuizScore);
  const storedLessonId = useLessonStore((s) => s.currentLesson);
  const xp = useLessonStore((s) => s.xp);
  const hearts = useLessonStore((s) => s.hearts);

  // Per-card validation results for the current session (not persisted).
  const [results, setResults] = React.useState<Record<string, ValidationResult>>(
    {}
  );
  const prevIndex = React.useRef(0);
  const successControls = useAnimationControls();

  // Start (or resume) the lesson exactly once per lesson id.
  React.useEffect(() => {
    if (!lesson) return;
    if (storedLessonId !== lesson.id) {
      startLesson({
        lessonId: lesson.id,
        language: lesson.language,
        courseId: courseId ?? null,
        sectionId: sectionId ?? null,
      });
      setResults({});
    } else {
      nav.resume();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson?.id]);

  if (isLoading || !lesson) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (lesson.cards.length === 0) {
    return <EmptyLessonState onExit={onExit} />;
  }

  const direction = nav.currentIndex >= prevIndex.current ? 1 : -1;

  if (nav.isComplete) {
    return (
      <CompletionScreen
        correct={useLessonStore.getState().correctAnswers}
        total={lesson.cards.length}
        xp={xp}
        onRestart={() => {
          nav.restart();
          setResults({});
        }}
        onExit={onExit}
      />
    );
  }

  const card = lesson.cards[nav.currentIndex] as LessonCard;
  const Component = getCardComponent(card.type);
  const mustAnswer = isValidatingCard(card);
  const currentResult = results[card.id] ?? null;
  const answered = card.id in results;

  const handleSubmit = (response: unknown) => {
    if (answered) return;
    const result = validateCard(card, response);
    setResults((prev) => ({ ...prev, [card.id]: result }));
    markCardCompleted(card.id);
    if (typeof result.score === "number") setQuizScore(result.score);
    if (result.isCorrect) {
      recordCorrect();
      addXp(XP_CORRECT);
      if (!reduce) {
        void successControls.start({
          scale: [1, 1.02, 1],
          transition: { duration: 0.3, ease: "easeOut" },
        });
      }
    } else {
      recordWrong();
    }
  };

  const advance = () => {
    if (!mustAnswer) {
      markCardCompleted(card.id);
      addXp(XP_VIEW);
    }
    prevIndex.current = nav.currentIndex;
    nav.next();
  };

  const skip = () => {
    prevIndex.current = nav.currentIndex;
    nav.skip();
  };

  const canContinue = !mustAnswer || answered;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <header className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Exit lesson"
          onClick={nav.exit}
        >
          <X className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <ProgressBar
            percent={nav.progressPercent}
            label={`Card ${nav.currentIndex + 1} of ${nav.totalCards} · ~${Math.ceil(
              nav.estimatedTimeRemaining / 60
            )} min left`}
          />
        </div>
        <HeartsDisplay hearts={hearts} max={MAX_HEARTS} />
        <XpDisplay xp={xp} />
      </header>

      <AnimatePresence initial={false}>
        <CardShell key={card.id} direction={direction}>
          <React.Suspense
            fallback={
              <div className="flex items-center justify-center py-16 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            }
          >
            {Component ? (
              <motion.div animate={successControls}>
                <Component
                  card={card}
                  onSubmit={handleSubmit}
                  result={currentResult}
                  answered={answered}
                />
              </motion.div>
            ) : (
              <UnknownCardFallback type={card.type} />
            )}
          </React.Suspense>
        </CardShell>
      </AnimatePresence>

      <footer className="flex items-center justify-between">
        <Button variant="ghost" onClick={skip}>
          Skip
        </Button>
        <Button
          variant={canContinue ? "accent" : "outline"}
          size="lg"
          onClick={advance}
          disabled={!canContinue}
        >
          {nav.isLast ? "Finish" : "Continue"}
        </Button>
      </footer>
    </div>
  );
}

function CompletionScreen({
  correct,
  total,
  xp,
  onRestart,
  onExit,
}: {
  correct: number;
  total: number;
  xp: number;
  onRestart: () => void;
  onExit?: () => void;
}) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4 rounded-2xl border border-border bg-card p-10 text-center">
      <h2 className="text-2xl font-bold text-foreground">Lesson complete</h2>
      <p className="text-muted-foreground">
        You answered <span className="font-semibold text-foreground">{correct}</span>{" "}
        of {total} cards correctly and earned{" "}
        <span className="font-semibold text-accent">{xp} XP</span>.
      </p>
      <div className="flex gap-2">
        <Button variant="outline" onClick={onRestart}>
          Restart
        </Button>
        {onExit && (
          <Button variant="accent" onClick={onExit}>
            Done
          </Button>
        )}
      </div>
    </div>
  );
}
