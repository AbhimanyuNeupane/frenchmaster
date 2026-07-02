import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// --- In-memory fake lesson injected through a mocked useLesson hook. ----------
// This proves the registry-driven architecture end-to-end WITHOUT depending on
// the real 21-card catalog: the lesson below uses two card types that exist
// only in this test and are registered at runtime.
const fakeLesson = {
  id: "test_lesson",
  language: "xx",
  level: "A1",
  title: "Test Lesson",
  cards: [
    { id: "a", type: "TIntro", content: { text: "Intro card" } },
    {
      id: "b",
      type: "TQuestion",
      content: {
        prompt: "Pick the first option",
        options: [
          { id: "o1", text: "Option One" },
          { id: "o2", text: "Option Two" },
        ],
      },
      validation: { correct: "o1" },
    },
  ],
};

vi.mock("../hooks/useLesson", () => ({
  useLesson: () => ({
    data: fakeLesson,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

import { LessonRenderer } from "../engine/LessonRenderer";
import { registerCardComponent } from "../registry/componentRegistry";
import { registerValidator } from "../registry/validatorRegistry";
import { useLessonStore } from "../store/useLessonStore";
import type { CardComponentProps } from "../types";

// Test-only card components (kept tiny; they only talk through the prop contract).
function TIntro({ card }: CardComponentProps) {
  const content = card.content as unknown as { text: string };
  return <div>{content.text}</div>;
}

function TQuestion({ card, onSubmit }: CardComponentProps) {
  const content = card.content as unknown as {
    prompt: string;
    options: { id: string; text: string }[];
  };
  return (
    <div>
      <p>{content.prompt}</p>
      {content.options.map((o) => (
        <button key={o.id} onClick={() => onSubmit(o.id)}>
          {o.text}
        </button>
      ))}
    </div>
  );
}

registerCardComponent("TIntro", TIntro);
registerCardComponent("TQuestion", TQuestion);
registerValidator("TQuestion", (card, response) => {
  const v = card.validation as unknown as { correct: string };
  return { isCorrect: response === v.correct };
});

describe("LessonRenderer (registry-driven integration)", () => {
  beforeEach(() => {
    useLessonStore.getState().reset();
  });

  it("clicks through a lesson of runtime-registered card types to completion", async () => {
    const user = userEvent.setup();
    const onExit = vi.fn();
    render(<LessonRenderer lessonId="test_lesson" onExit={onExit} />);

    // Card 1: a display-only card resolved purely via the registry.
    expect(screen.getByText("Intro card")).toBeInTheDocument();

    // Continue is enabled for a non-validating card.
    await user.click(screen.getByRole("button", { name: /continue/i }));

    // Card 2: interactive. Answering an option submits it to the engine, which
    // validates via the runtime-registered validator and updates the store.
    expect(screen.getByText("Pick the first option")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Option One" }));

    expect(useLessonStore.getState().correctAnswers).toBe(1);

    // Finish -> completion state.
    await user.click(screen.getByRole("button", { name: /finish/i }));
    expect(screen.getByText(/lesson complete/i)).toBeInTheDocument();
  });
});
