import { vocabularyRepository } from "../repositories/vocabulary.repository";
import { userRepository } from "../repositories/user.repository";
import { ApiError } from "../utils/ApiError";
import { resolveVocabularyTranslation } from "../utils/vocabularyTranslation";
import type {
  CEFRLevel,
  MasteryStatus,
  UserVocabularyProgress,
  VocabularyTranslation,
  VocabularyWord as PrismaVocabularyWord,
} from "@prisma/client";
import type { ListVocabularyQuery } from "../validators/vocabulary.validators";

const MASTERY_PROGRESSION: Record<MasteryStatus, MasteryStatus> = {
  new: "learning",
  learning: "mastered",
  mastered: "mastered", // no-op past mastered, per contract
};

/** Default per-user state for a word with no UserVocabularyProgress row yet. */
const DEFAULT_PROGRESS = {
  isFavorite: false,
  masteryStatus: "new" as MasteryStatus,
  lastReviewedAt: null as Date | null,
};

type WordWithTranslations = PrismaVocabularyWord & { translations: VocabularyTranslation[] };

function toVocabularyWord(
  word: WordWithTranslations,
  progress: Pick<UserVocabularyProgress, "isFavorite" | "masteryStatus" | "lastReviewedAt"> | undefined,
  primaryLanguageCode: string
) {
  const effective = progress ?? DEFAULT_PROGRESS;
  const { english, nativeTranslation } = resolveVocabularyTranslation(word.translations, primaryLanguageCode);
  return {
    id: word.id,
    french: word.french,
    english,
    nativeTranslation,
    gender: word.gender,
    partOfSpeech: word.partOfSpeech,
    pronunciationIpa: word.pronunciationIpa,
    audioUrl: word.audioUrl,
    exampleFr: word.exampleFr,
    exampleEn: word.exampleEn,
    imageUrl: word.imageUrl,
    synonyms: word.synonyms,
    commonMistake: word.commonMistake,
    level: word.level,
    unitTitle: word.unitTitle,
    isFavorite: effective.isFavorite,
    masteryStatus: effective.masteryStatus,
    lastReviewedAt: effective.lastReviewedAt ? effective.lastReviewedAt.toISOString() : null,
  };
}

/**
 * Fresh per-request read of the user's language preference. Deliberately
 * NOT taken from the JWT payload (`req.user`) — the access token is signed
 * once at login/refresh time with only {sub, email, role}, so it would go
 * stale the instant a user changes their primary language via
 * PATCH /api/auth/me until their next token refresh.
 */
async function getPrimaryLanguageCode(userId: string): Promise<string> {
  const user = await userRepository.findById(userId);
  return user?.primaryLanguageCode ?? "en";
}

export const vocabularyService = {
  /**
   * Returns the (optionally filtered) word list plus stats computed over
   * the user's FULL vocabulary set — per
   * docs/BACKEND_API_CONTRACT_VOCABULARY.md, stats must never reflect just
   * the filtered/paginated page.
   */
  async getVocabulary(userId: string, query: ListVocabularyQuery) {
    const [filteredWords, allWordIds, progressRows, primaryLanguageCode] = await Promise.all([
      vocabularyRepository.findWords({
        level: query.level as CEFRLevel | undefined,
        search: query.search,
      }),
      vocabularyRepository.findAllWordIds(),
      vocabularyRepository.findAllProgressForUser(userId),
      getPrimaryLanguageCode(userId),
    ]);

    const progressByWordId = new Map(progressRows.map((p) => [p.wordId, p]));

    // --- stats: full set, independent of level/search/favoritesOnly/dueOnly ---
    let mastered = 0;
    let favorites = 0;
    let dueForReview = 0;
    for (const { id } of allWordIds) {
      const progress = progressByWordId.get(id) ?? DEFAULT_PROGRESS;
      if (progress.masteryStatus === "mastered") mastered += 1;
      else dueForReview += 1; // dueOnly semantics: masteryStatus != "mastered"
      if (progress.isFavorite) favorites += 1;
    }
    const stats = {
      total: allWordIds.length,
      mastered,
      favorites,
      dueForReview,
    };

    // --- words: filtered set (level/search applied in the repo query),
    // plus in-memory favoritesOnly/dueOnly filters, joined with progress ---
    let words = filteredWords.map((word) =>
      toVocabularyWord(word, progressByWordId.get(word.id), primaryLanguageCode)
    );

    if (query.favoritesOnly) {
      words = words.filter((w) => w.isFavorite);
    }
    if (query.dueOnly) {
      words = words.filter((w) => w.masteryStatus !== "mastered");
    }

    return { words, stats };
  },

  async toggleFavorite(userId: string, wordId: string) {
    const [word, primaryLanguageCode] = await Promise.all([
      vocabularyRepository.findWordById(wordId),
      getPrimaryLanguageCode(userId),
    ]);
    if (!word) {
      throw ApiError.notFound("Vocabulary word not found");
    }

    const existing = await vocabularyRepository.findProgress(userId, wordId);
    const nextIsFavorite = !(existing?.isFavorite ?? false);

    const updated = await vocabularyRepository.upsertProgress(userId, wordId, {
      isFavorite: nextIsFavorite,
    });

    return toVocabularyWord(word, updated, primaryLanguageCode);
  },

  async markReviewed(userId: string, wordId: string) {
    const [word, primaryLanguageCode] = await Promise.all([
      vocabularyRepository.findWordById(wordId),
      getPrimaryLanguageCode(userId),
    ]);
    if (!word) {
      throw ApiError.notFound("Vocabulary word not found");
    }

    const existing = await vocabularyRepository.findProgress(userId, wordId);
    const currentStatus = existing?.masteryStatus ?? "new";
    const nextStatus = MASTERY_PROGRESSION[currentStatus];

    const updated = await vocabularyRepository.upsertProgress(userId, wordId, {
      masteryStatus: nextStatus,
      lastReviewedAt: new Date(),
    });

    return toVocabularyWord(word, updated, primaryLanguageCode);
  },
};
