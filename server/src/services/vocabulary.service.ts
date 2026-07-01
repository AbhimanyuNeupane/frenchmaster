import { vocabularyRepository } from "@/repositories/vocabulary.repository";
import { ApiError } from "@/utils/ApiError";
import type {
  CEFRLevel,
  MasteryStatus,
  UserVocabularyProgress,
  VocabularyWord as PrismaVocabularyWord,
} from "@prisma/client";
import type { ListVocabularyQuery } from "@/validators/vocabulary.validators";

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

function toVocabularyWord(
  word: PrismaVocabularyWord,
  progress: Pick<UserVocabularyProgress, "isFavorite" | "masteryStatus" | "lastReviewedAt"> | undefined
) {
  const effective = progress ?? DEFAULT_PROGRESS;
  return {
    id: word.id,
    french: word.french,
    english: word.english,
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

export const vocabularyService = {
  /**
   * Returns the (optionally filtered) word list plus stats computed over
   * the user's FULL vocabulary set — per
   * docs/BACKEND_API_CONTRACT_VOCABULARY.md, stats must never reflect just
   * the filtered/paginated page.
   */
  async getVocabulary(userId: string, query: ListVocabularyQuery) {
    const [filteredWords, allWordIds, progressRows] = await Promise.all([
      vocabularyRepository.findWords({
        level: query.level as CEFRLevel | undefined,
        search: query.search,
      }),
      vocabularyRepository.findAllWordIds(),
      vocabularyRepository.findAllProgressForUser(userId),
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
    let words = filteredWords.map((word) => toVocabularyWord(word, progressByWordId.get(word.id)));

    if (query.favoritesOnly) {
      words = words.filter((w) => w.isFavorite);
    }
    if (query.dueOnly) {
      words = words.filter((w) => w.masteryStatus !== "mastered");
    }

    return { words, stats };
  },

  async toggleFavorite(userId: string, wordId: string) {
    const word = await vocabularyRepository.findWordById(wordId);
    if (!word) {
      throw ApiError.notFound("Vocabulary word not found");
    }

    const existing = await vocabularyRepository.findProgress(userId, wordId);
    const nextIsFavorite = !(existing?.isFavorite ?? false);

    const updated = await vocabularyRepository.upsertProgress(userId, wordId, {
      isFavorite: nextIsFavorite,
    });

    return toVocabularyWord(word, updated);
  },

  async markReviewed(userId: string, wordId: string) {
    const word = await vocabularyRepository.findWordById(wordId);
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

    return toVocabularyWord(word, updated);
  },
};
