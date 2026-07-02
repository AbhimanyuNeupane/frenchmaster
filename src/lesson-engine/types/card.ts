import type * as React from "react";
import type { MediaRef } from "./media";
import type { ValidationResult } from "./validation";

/**
 * Card model — the heart of the engine.
 *
 * `CardBase` is the generic shape the renderer/navigation/validation engines
 * see. `LessonCard` is a discriminated union over `type` that narrows
 * `content`/`validation` to a concrete, usable shape per card type. The union
 * gives full type-safety INSIDE each card component while keeping the engine's
 * view fully generic — the renderer only ever holds a `LessonCard`, never a
 * specific variant, so it can never grow a `switch (card.type)`.
 */

export interface CardMetadata {
  /** Used by navigation to estimate remaining time; falls back to a per-card
   *  count estimate when absent. */
  estimatedSeconds?: number;
  difficulty?: "easy" | "medium" | "hard";
  tags?: string[];
  [key: string]: unknown;
}

export interface CardAction {
  id: string;
  label: string;
  kind?: "primary" | "secondary" | "skip";
}

export interface CardBase {
  id: string;
  /** Registry key — the ONLY thing that decides which component renders. */
  type: string;
  title?: string;
  content: unknown;
  media?: MediaRef[];
  actions?: CardAction[];
  /** Narrowed per-type; absent = no validation (engine auto-passes). */
  validation?: unknown;
  metadata?: CardMetadata;
}

/* --------------------------------------------------------------------------
 * Shared content primitives
 * ------------------------------------------------------------------------ */

export interface ChoiceOption {
  id: string;
  text: string;
}

export interface ImageChoiceOption {
  id: string;
  label?: string;
  image: MediaRef;
}

export interface OrderableItem {
  id: string;
  text: string;
}

export interface MatchingPair {
  id: string;
  left: string;
  right: string;
}

export interface ConversationLine {
  speaker: string;
  text: string;
  translation?: string;
  audio?: MediaRef;
}

export interface ExampleSentence {
  text: string;
  translation?: string;
}

/* --------------------------------------------------------------------------
 * Display-only cards (no validation)
 * ------------------------------------------------------------------------ */

export interface TextCardModel extends CardBase {
  type: "TextCard";
  content: { body: string; subtitle?: string };
  validation?: never;
}

export interface ImageCardModel extends CardBase {
  type: "ImageCard";
  content: { image: MediaRef; alt: string; caption?: string };
  validation?: never;
}

export interface AudioCardModel extends CardBase {
  type: "AudioCard";
  content: { audio: MediaRef; caption?: string; transcript?: string };
  validation?: never;
}

export interface GrammarCardModel extends CardBase {
  type: "GrammarCard";
  content: { explanation: string; examples: ExampleSentence[] };
  validation?: never;
}

export interface InfoCardModel extends CardBase {
  type: "InfoCard";
  content: { body: string; tone?: "note" | "tip" | "warning" };
  validation?: never;
}

export interface FlashCardModel extends CardBase {
  type: "FlashCard";
  content: { front: string; back: string; hint?: string };
  validation?: never;
}

export interface ConversationCardModel extends CardBase {
  type: "ConversationCard";
  content: { scenario?: string; lines: ConversationLine[] };
  validation?: never;
}

export interface SummaryCardModel extends CardBase {
  type: "SummaryCard";
  content: { heading?: string; points: string[] };
  validation?: never;
}

export interface RewardCardModel extends CardBase {
  type: "RewardCard";
  content: { title: string; message: string; xp?: number; badge?: string };
  validation?: never;
}

/**
 * Full vocabulary model carried by the spec. `aiNotes` is reserved for a future
 * AI-explanations phase and is intentionally left unused today.
 */
export interface VocabularyCardModel extends CardBase {
  type: "VocabularyCard";
  content: {
    word: string;
    nativeTranslation: string;
    englishTranslation: string;
    pronunciation?: string;
    ipa?: string;
    gender?: "masculine" | "feminine" | "neuter" | "none";
    plural?: string;
    partOfSpeech?: string;
    difficulty?: "easy" | "medium" | "hard";
    exampleSentence?: string;
    nativeExample?: string;
    image?: MediaRef;
    audio?: MediaRef;
    /** Future AI Notes — reserved, unused this phase. */
    aiNotes?: string;
  };
  validation?: never;
}

/* --------------------------------------------------------------------------
 * Interactive / validating cards
 * ------------------------------------------------------------------------ */

export interface MultipleChoiceCardModel extends CardBase {
  type: "MultipleChoiceCard";
  content: { prompt: string; options: ChoiceOption[] };
  validation: { correctOptionId: string };
}

export interface MultipleSelectCardModel extends CardBase {
  type: "MultipleSelectCard";
  content: { prompt: string; options: ChoiceOption[] };
  validation: { correctOptionIds: string[] };
}

export interface TrueFalseCardModel extends CardBase {
  type: "TrueFalseCard";
  content: { statement: string };
  validation: { answer: boolean };
}

export interface ImageChoiceCardModel extends CardBase {
  type: "ImageChoiceCard";
  content: { prompt: string; options: ImageChoiceOption[] };
  validation: { correctOptionId: string };
}

export interface FillBlankCardModel extends CardBase {
  type: "FillBlankCard";
  /** `textWithBlanks` uses `___` as the blank marker, e.g. "Je ___ français". */
  content: { textWithBlanks: string; hint?: string };
  validation: { acceptedAnswers: string[] };
}

export interface WritingCardModel extends CardBase {
  type: "WritingCard";
  content: { prompt: string; placeholder?: string };
  validation: { acceptedAnswers: string[]; fuzzyMatch?: boolean };
}

export interface DragOrderCardModel extends CardBase {
  type: "DragOrderCard";
  /** `items` are given pre-shuffled for display; correct sequence is in validation. */
  content: { prompt: string; items: OrderableItem[] };
  validation: { correctOrder: string[] };
}

export interface MatchingCardModel extends CardBase {
  type: "MatchingCard";
  /** Pairs are the source of truth; the right column is shuffled for display by
   *  the component, and the validator derives correctness from the same ids. */
  content: { prompt?: string; pairs: MatchingPair[] };
  validation?: never;
}

export interface ListeningCardModel extends CardBase {
  type: "ListeningCard";
  content: { prompt: string; audio: MediaRef; options: ChoiceOption[] };
  validation: { correctOptionId: string };
}

export interface SpeakingCardModel extends CardBase {
  type: "SpeakingCard";
  content: { prompt: string; targetText: string; referenceAudio?: MediaRef };
  /** Speaking scoring is a deliberate placeholder — real speech recognition is
   *  a future phase. The validator returns a seeded placeholder score. */
  validation: { placeholderScore: true };
}

export type QuizSubQuestion =
  | { id: string; kind: "mc"; prompt: string; options: ChoiceOption[] }
  | { id: string; kind: "tf"; prompt: string };

export interface QuizCardModel extends CardBase {
  type: "QuizCard";
  content: { intro?: string; questions: QuizSubQuestion[] };
  /** Answer key keyed by sub-question id. `mc` -> option id, `tf` -> boolean. */
  validation: { answers: Record<string, string | boolean> };
}

/* --------------------------------------------------------------------------
 * The discriminated union
 * ------------------------------------------------------------------------ */

export type LessonCard =
  | TextCardModel
  | ImageCardModel
  | AudioCardModel
  | VocabularyCardModel
  | GrammarCardModel
  | InfoCardModel
  | FlashCardModel
  | ListeningCardModel
  | SpeakingCardModel
  | WritingCardModel
  | ConversationCardModel
  | FillBlankCardModel
  | DragOrderCardModel
  | MatchingCardModel
  | MultipleChoiceCardModel
  | MultipleSelectCardModel
  | TrueFalseCardModel
  | ImageChoiceCardModel
  | SummaryCardModel
  | QuizCardModel
  | RewardCardModel;

/** All known card type keys (for docs/tests; the engine never switches on them). */
export type CardType = LessonCard["type"];

/* --------------------------------------------------------------------------
 * Component contract
 * ------------------------------------------------------------------------ */

/**
 * Uniform props every card component receives. A card renders `card.content`,
 * and — if interactive — reports the learner's RAW response via `onSubmit`. The
 * engine (not the card) runs that response through the validator registry and
 * feeds the `result` back down for feedback UI. `onContinue` advances past a
 * display-only card. This prop contract is the reuse boundary: a card that only
 * talks through these props is portable to a future mobile renderer unchanged.
 */
export interface CardComponentProps<T extends LessonCard = LessonCard> {
  card: T;
  /** Report the learner's raw answer; the engine validates it. */
  onSubmit: (response: unknown) => void;
  /** Advance without submitting an answer (display-only cards). */
  onContinue?: () => void;
  /** Validation outcome after a submit, for feedback UI. `null` until answered. */
  result?: ValidationResult | null;
  /** True once this card has been answered/validated. */
  answered?: boolean;
  /** Lock inputs (e.g. while a transition is animating). */
  disabled?: boolean;
}

export type CardComponent = React.ComponentType<CardComponentProps>;
