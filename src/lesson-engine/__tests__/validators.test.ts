import { describe, it, expect } from "vitest";
// Importing the validation barrel registers every real validator as a side effect.
import { validateCard } from "../validation";
import type {
  DragOrderCardModel,
  FillBlankCardModel,
  MatchingCardModel,
  MultipleChoiceCardModel,
  WritingCardModel,
} from "../types";

describe("multiple-choice validator", () => {
  const card: MultipleChoiceCardModel = {
    id: "mc",
    type: "MultipleChoiceCard",
    content: {
      prompt: "?",
      options: [
        { id: "a", text: "A" },
        { id: "b", text: "B" },
      ],
    },
    validation: { correctOptionId: "b" },
  };

  it("accepts the correct option", () => {
    expect(validateCard(card, "b").isCorrect).toBe(true);
  });
  it("rejects a wrong option", () => {
    expect(validateCard(card, "a").isCorrect).toBe(false);
  });
  it("rejects undefined response", () => {
    expect(validateCard(card, undefined).isCorrect).toBe(false);
  });
});

describe("fill-blank validator", () => {
  const card: FillBlankCardModel = {
    id: "fb",
    type: "FillBlankCard",
    content: { textWithBlanks: "Je ___ français" },
    validation: { acceptedAnswers: ["parle"] },
  };

  it("accepts an exact answer", () => {
    expect(validateCard(card, "parle").isCorrect).toBe(true);
  });
  it("is case- and whitespace-insensitive", () => {
    expect(validateCard(card, "  PARLE  ").isCorrect).toBe(true);
  });
  it("rejects empty/whitespace input", () => {
    expect(validateCard(card, "   ").isCorrect).toBe(false);
  });
});

describe("drag-order validator", () => {
  const card: DragOrderCardModel = {
    id: "do",
    type: "DragOrderCard",
    content: {
      prompt: "order",
      items: [
        { id: "w1", text: "Je" },
        { id: "w2", text: "parle" },
      ],
    },
    validation: { correctOrder: ["w1", "w2"] },
  };

  it("accepts the exact sequence", () => {
    expect(validateCard(card, ["w1", "w2"]).isCorrect).toBe(true);
  });
  it("rejects a wrong sequence", () => {
    expect(validateCard(card, ["w2", "w1"]).isCorrect).toBe(false);
  });
  it("rejects a wrong length", () => {
    expect(validateCard(card, ["w1"]).isCorrect).toBe(false);
  });
});

describe("matching validator (derived from pairs)", () => {
  const card: MatchingCardModel = {
    id: "mt",
    type: "MatchingCard",
    content: {
      pairs: [
        { id: "p1", left: "Bonjour", right: "Hello" },
        { id: "p2", left: "Merci", right: "Thanks" },
      ],
    },
  };

  it("accepts all-correct matches", () => {
    const res = validateCard(card, { p1: "p1", p2: "p2" });
    expect(res.isCorrect).toBe(true);
    expect(res.score).toBe(100);
  });
  it("rejects a partial match and reports score", () => {
    const res = validateCard(card, { p1: "p1", p2: "p1" });
    expect(res.isCorrect).toBe(false);
    expect(res.score).toBe(50);
  });
  it("rejects an empty response", () => {
    expect(validateCard(card, {}).isCorrect).toBe(false);
  });
});

describe("writing validator", () => {
  const exact: WritingCardModel = {
    id: "w1",
    type: "WritingCard",
    content: { prompt: "Write hello" },
    validation: { acceptedAnswers: ["bonjour"] },
  };
  const fuzzy: WritingCardModel = {
    id: "w2",
    type: "WritingCard",
    content: { prompt: "Write hello" },
    validation: { acceptedAnswers: ["bonjour"], fuzzyMatch: true },
  };

  it("accepts an exact (normalized) answer", () => {
    expect(validateCard(exact, "Bonjour.").isCorrect).toBe(true);
  });
  it("rejects a typo when fuzzy is off", () => {
    expect(validateCard(exact, "bonjuor").isCorrect).toBe(false);
  });
  it("accepts a small typo when fuzzy is on", () => {
    // One-character deletion ("bonjor" -> "bonjour") is within tolerance.
    expect(validateCard(fuzzy, "bonjor").isCorrect).toBe(true);
  });
  it("rejects empty input", () => {
    expect(validateCard(fuzzy, "").isCorrect).toBe(false);
  });
});

describe("auto-pass for cards with no validator", () => {
  it("treats a display card as correct", () => {
    const res = validateCard(
      { id: "t", type: "TextCard", content: { body: "hi" } } as never,
      undefined
    );
    expect(res.isCorrect).toBe(true);
  });
});
