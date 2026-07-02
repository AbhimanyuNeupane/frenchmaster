"use client";

import { Check, Mic } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Exercise } from "@/types/lesson";

/**
 * Renders the answer control for a single exercise. Every type maps to a
 * real input; unknown/not-yet-seeded types (arrange_sentence, match,
 * audio_question, image_question) degrade to a generic text input so an
 * unexpected type can never crash the player.
 */
export function ExerciseInput({
  exercise,
  value,
  onChange,
  disabled,
}: {
  exercise: Exercise;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}) {
  const media = (
    <>
      {exercise.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={exercise.imageUrl}
          alt=""
          className="mb-4 h-44 w-full rounded-xl object-cover"
        />
      )}
      {exercise.audioUrl && <audio controls src={exercise.audioUrl} className="mb-4 w-full" />}
    </>
  );

  // Choice-based types: multiple_choice, true_false (and any seeded type
  // that ships non-empty options).
  if (
    (exercise.type === "multiple_choice" ||
      exercise.type === "true_false" ||
      exercise.options.length > 0) &&
    exercise.type !== "typing" &&
    exercise.type !== "fill_blank" &&
    exercise.type !== "speaking_prompt"
  ) {
    return (
      <div className="flex flex-col gap-3">
        {media}
        <div className="flex flex-col gap-2.5">
          {exercise.options.map((option) => {
            const selected = value === option;
            return (
              <button
                key={option}
                type="button"
                disabled={disabled}
                onClick={() => onChange(option)}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors",
                  "disabled:cursor-not-allowed",
                  selected
                    ? "border-accent bg-accent/10 text-navy"
                    : "border-border bg-card text-foreground hover:border-accent/40 hover:bg-secondary/60"
                )}
              >
                <span>{option}</span>
                <span
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-full border",
                    selected ? "border-accent bg-accent text-white" : "border-border"
                  )}
                >
                  {selected && <Check className="size-3" strokeWidth={3} />}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Speaking: no working speech-to-text yet. Show an honest "coming soon"
  // mic affordance plus a typed fallback so the exercise stays completable.
  if (exercise.type === "speaking_prompt") {
    return (
      <div className="flex flex-col gap-3">
        {media}
        <div className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-secondary/40 px-4 py-3">
          <button
            type="button"
            disabled
            aria-label="Record pronunciation (coming soon)"
            className="flex size-10 shrink-0 cursor-not-allowed items-center justify-center rounded-full bg-muted text-muted-foreground/50"
          >
            <Mic className="size-4" />
          </button>
          <p className="text-xs text-muted-foreground">
            Pronunciation scoring is coming soon. For now, type the phrase to check your answer.
          </p>
        </div>
        <Input
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type what you would say…"
          aria-label="Your answer"
        />
      </div>
    );
  }

  // Free-text types: fill_blank, typing, and the generic fallback.
  return (
    <div className="flex flex-col gap-3">
      {media}
      <Input
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type your answer…"
        aria-label="Your answer"
      />
    </div>
  );
}
