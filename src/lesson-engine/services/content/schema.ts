import { z } from "zod";

/**
 * Zod schemas mirroring the Phase 3 types. Every lesson loaded by a content
 * provider is validated against `lessonSchema` so corrupt/hand-edited JSON is
 * caught at load time and surfaced as a typed LessonLoadError, never an
 * unhandled runtime crash deep inside a card.
 */

const mediaRef = z.object({ key: z.string().min(1) });
const choiceOption = z.object({ id: z.string(), text: z.string() });
const imageChoiceOption = z.object({
  id: z.string(),
  label: z.string().optional(),
  image: mediaRef,
});
const orderableItem = z.object({ id: z.string(), text: z.string() });
const matchingPair = z.object({
  id: z.string(),
  left: z.string(),
  right: z.string(),
});
const example = z.object({ text: z.string(), translation: z.string().optional() });
const conversationLine = z.object({
  speaker: z.string(),
  text: z.string(),
  translation: z.string().optional(),
  audio: mediaRef.optional(),
});

const cardAction = z.object({
  id: z.string(),
  label: z.string(),
  kind: z.enum(["primary", "secondary", "skip"]).optional(),
});
const metadata = z.record(z.string(), z.unknown()).optional();

/** Fields common to every card variant. */
const base = {
  id: z.string(),
  title: z.string().optional(),
  media: z.array(mediaRef).optional(),
  actions: z.array(cardAction).optional(),
  metadata,
};

const textCard = z.object({
  ...base,
  type: z.literal("TextCard"),
  content: z.object({ body: z.string(), subtitle: z.string().optional() }),
});

const imageCard = z.object({
  ...base,
  type: z.literal("ImageCard"),
  content: z.object({
    image: mediaRef,
    alt: z.string(),
    caption: z.string().optional(),
  }),
});

const audioCard = z.object({
  ...base,
  type: z.literal("AudioCard"),
  content: z.object({
    audio: mediaRef,
    caption: z.string().optional(),
    transcript: z.string().optional(),
  }),
});

const vocabularyCard = z.object({
  ...base,
  type: z.literal("VocabularyCard"),
  content: z.object({
    word: z.string(),
    nativeTranslation: z.string(),
    englishTranslation: z.string(),
    pronunciation: z.string().optional(),
    ipa: z.string().optional(),
    gender: z.enum(["masculine", "feminine", "neuter", "none"]).optional(),
    plural: z.string().optional(),
    partOfSpeech: z.string().optional(),
    difficulty: z.enum(["easy", "medium", "hard"]).optional(),
    exampleSentence: z.string().optional(),
    nativeExample: z.string().optional(),
    image: mediaRef.optional(),
    audio: mediaRef.optional(),
    aiNotes: z.string().optional(),
  }),
});

const grammarCard = z.object({
  ...base,
  type: z.literal("GrammarCard"),
  content: z.object({
    explanation: z.string(),
    examples: z.array(example),
  }),
});

const infoCard = z.object({
  ...base,
  type: z.literal("InfoCard"),
  content: z.object({
    body: z.string(),
    tone: z.enum(["note", "tip", "warning"]).optional(),
  }),
});

const flashCard = z.object({
  ...base,
  type: z.literal("FlashCard"),
  content: z.object({
    front: z.string(),
    back: z.string(),
    hint: z.string().optional(),
  }),
});

const conversationCard = z.object({
  ...base,
  type: z.literal("ConversationCard"),
  content: z.object({
    scenario: z.string().optional(),
    lines: z.array(conversationLine),
  }),
});

const summaryCard = z.object({
  ...base,
  type: z.literal("SummaryCard"),
  content: z.object({
    heading: z.string().optional(),
    points: z.array(z.string()),
  }),
});

const rewardCard = z.object({
  ...base,
  type: z.literal("RewardCard"),
  content: z.object({
    title: z.string(),
    message: z.string(),
    xp: z.number().optional(),
    badge: z.string().optional(),
  }),
});

const multipleChoiceCard = z.object({
  ...base,
  type: z.literal("MultipleChoiceCard"),
  content: z.object({ prompt: z.string(), options: z.array(choiceOption) }),
  validation: z.object({ correctOptionId: z.string() }),
});

const multipleSelectCard = z.object({
  ...base,
  type: z.literal("MultipleSelectCard"),
  content: z.object({ prompt: z.string(), options: z.array(choiceOption) }),
  validation: z.object({ correctOptionIds: z.array(z.string()) }),
});

const trueFalseCard = z.object({
  ...base,
  type: z.literal("TrueFalseCard"),
  content: z.object({ statement: z.string() }),
  validation: z.object({ answer: z.boolean() }),
});

const imageChoiceCard = z.object({
  ...base,
  type: z.literal("ImageChoiceCard"),
  content: z.object({
    prompt: z.string(),
    options: z.array(imageChoiceOption),
  }),
  validation: z.object({ correctOptionId: z.string() }),
});

const fillBlankCard = z.object({
  ...base,
  type: z.literal("FillBlankCard"),
  content: z.object({
    textWithBlanks: z.string(),
    hint: z.string().optional(),
  }),
  validation: z.object({ acceptedAnswers: z.array(z.string()) }),
});

const writingCard = z.object({
  ...base,
  type: z.literal("WritingCard"),
  content: z.object({
    prompt: z.string(),
    placeholder: z.string().optional(),
  }),
  validation: z.object({
    acceptedAnswers: z.array(z.string()),
    fuzzyMatch: z.boolean().optional(),
  }),
});

const dragOrderCard = z.object({
  ...base,
  type: z.literal("DragOrderCard"),
  content: z.object({ prompt: z.string(), items: z.array(orderableItem) }),
  validation: z.object({ correctOrder: z.array(z.string()) }),
});

const matchingCard = z.object({
  ...base,
  type: z.literal("MatchingCard"),
  content: z.object({
    prompt: z.string().optional(),
    pairs: z.array(matchingPair),
  }),
});

const listeningCard = z.object({
  ...base,
  type: z.literal("ListeningCard"),
  content: z.object({
    prompt: z.string(),
    audio: mediaRef,
    options: z.array(choiceOption),
  }),
  validation: z.object({ correctOptionId: z.string() }),
});

const speakingCard = z.object({
  ...base,
  type: z.literal("SpeakingCard"),
  content: z.object({
    prompt: z.string(),
    targetText: z.string(),
    referenceAudio: mediaRef.optional(),
  }),
  validation: z.object({ placeholderScore: z.literal(true) }),
});

const quizSubQuestion = z.discriminatedUnion("kind", [
  z.object({
    id: z.string(),
    kind: z.literal("mc"),
    prompt: z.string(),
    options: z.array(choiceOption),
  }),
  z.object({ id: z.string(), kind: z.literal("tf"), prompt: z.string() }),
]);

const quizCard = z.object({
  ...base,
  type: z.literal("QuizCard"),
  content: z.object({
    intro: z.string().optional(),
    questions: z.array(quizSubQuestion),
  }),
  validation: z.object({
    answers: z.record(z.string(), z.union([z.string(), z.boolean()])),
  }),
});

export const cardSchema = z.discriminatedUnion("type", [
  textCard,
  imageCard,
  audioCard,
  vocabularyCard,
  grammarCard,
  infoCard,
  flashCard,
  conversationCard,
  summaryCard,
  rewardCard,
  multipleChoiceCard,
  multipleSelectCard,
  trueFalseCard,
  imageChoiceCard,
  fillBlankCard,
  writingCard,
  dragOrderCard,
  matchingCard,
  listeningCard,
  speakingCard,
  quizCard,
]);

export const lessonSchema = z.object({
  id: z.string(),
  language: z.string(),
  level: z.string(),
  title: z.string(),
  description: z.string().optional(),
  cards: z.array(cardSchema),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type ParsedLesson = z.infer<typeof lessonSchema>;
