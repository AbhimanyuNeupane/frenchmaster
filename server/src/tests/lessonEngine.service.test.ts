import { describe, it, expect, vi } from "vitest";

// --- Mocks: keep this a pure unit test, no live DB required. ---
// validateDraft never touches the repository, but the module-level import
// graph does (lessonEngine.service.ts imports lessonEngine.repository.ts,
// which imports ../config/prisma) — mock it out so this test never opens a
// real Prisma client.
vi.mock("../config/prisma", () => ({
  prisma: { lessonEngineLesson: {} },
}));

import { lessonEngineService } from "../services/lessonEngine.service";

const validCard = {
  id: "card-1",
  type: "flashcard",
  content: { front: "bonjour", back: "hello" },
};

const validDraft = {
  language: "fr",
  level: "A1",
  title: "Greetings",
  description: "Basic greetings",
  cards: [validCard],
  published: false,
};

describe("lessonEngineService.validateDraft", () => {
  it("accepts a structurally valid draft, id omitted", () => {
    const result = lessonEngineService.validateDraft(validDraft);
    expect(result).toEqual({ valid: true, errors: [] });
  });

  it("accepts a structurally valid draft with an id present", () => {
    const result = lessonEngineService.validateDraft({ ...validDraft, id: "fr_a1_greetings" });
    expect(result.valid).toBe(true);
  });

  it("rejects an empty cards array", () => {
    const result = lessonEngineService.validateDraft({ ...validDraft, cards: [] });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("cards"))).toBe(true);
  });

  it("rejects duplicate card ids within the lesson", () => {
    const result = lessonEngineService.validateDraft({
      ...validDraft,
      cards: [validCard, { ...validCard }],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.toLowerCase().includes("duplicate"))).toBe(true);
  });

  it("rejects a card missing a required envelope field (type)", () => {
    const { type, ...cardWithoutType } = validCard;
    void type;
    const result = lessonEngineService.validateDraft({ ...validDraft, cards: [cardWithoutType] });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("rejects a missing required top-level field (title) with a formatted 'path: message' error", () => {
    const { title, ...draftWithoutTitle } = validDraft;
    void title;
    const result = lessonEngineService.validateDraft(draftWithoutTitle);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.startsWith("title:"))).toBe(true);
  });

  it("rejects a malformed id (spaces not allowed) when id is supplied", () => {
    const result = lessonEngineService.validateDraft({ ...validDraft, id: "not a valid id" });
    expect(result.valid).toBe(false);
  });
});
