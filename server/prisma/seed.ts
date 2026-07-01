/* eslint-disable no-console */
import {
  PrismaClient,
  type SkillKey,
  type CEFRLevel,
  type WordGender,
  type PartOfSpeech,
  type MasteryStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/**
 * Seeds one demo user whose dashboard output closely reproduces
 * src/lib/mock-data.ts, so the real endpoint is demoable end-to-end against
 * numbers the frontend team already designed against. Exact XP/streak/date
 * math won't match the mock 1:1 (those are computed from raw activity here,
 * not hardcoded) but should land in the same ballpark.
 */

function daysAgo(n: number): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - n);
  return d;
}

async function main() {
  console.log("Seeding database...");

  // --- Demo user ("Camille" from mock-data.ts) ---
  const passwordHash = await bcrypt.hash("Password123", 12);
  const user = await prisma.user.upsert({
    where: { email: "camille@frenchmaster.dev" },
    update: {},
    create: {
      email: "camille@frenchmaster.dev",
      passwordHash,
      name: "Camille",
      avatarUrl: null,
      currentLevel: "A2",
      levelProgress: 62,
      coins: 1240,
      goalMinutesPerDay: 15,
    },
  });
  console.log(`Upserted demo user: ${user.email} (id: ${user.id})`);

  // --- Curriculum: Unit 3 "Eating Out" (A2) with a few lessons ---
  const unit = await prisma.unit.upsert({
    where: { id: "seed-unit-a2-u3" },
    update: {},
    create: {
      id: "seed-unit-a2-u3",
      title: "Unit 3 · Eating Out",
      description: "Restaurant conversations and ordering food",
      level: "A2",
      order: 3,
    },
  });

  const lessonDefs = [
    { id: "seed-lsn-a2-u3-l1", title: "Booking a Table", subtitle: "Making a reservation", order: 1, minutes: 8 },
    { id: "seed-lsn-a2-u3-l2", title: "Ordering at a Café", subtitle: "Restaurant conversations, part 2", order: 2, minutes: 12 },
    { id: "seed-lsn-a2-u3-l3", title: "Asking for the Bill", subtitle: "Polite requests and numbers", order: 3, minutes: 10 },
    { id: "seed-lsn-a2-u3-l4", title: "Dietary Restrictions", subtitle: "Allergies and preferences", order: 4, minutes: 9 },
  ];

  const lessons = [];
  for (const def of lessonDefs) {
    const lesson = await prisma.lesson.upsert({
      where: { id: def.id },
      update: {},
      create: {
        id: def.id,
        unitId: unit.id,
        title: def.title,
        subtitle: def.subtitle,
        level: "A2",
        order: def.order,
        estimatedMinutes: def.minutes,
      },
    });
    lessons.push(lesson);
  }

  // Lesson 1: completed. Lesson 2 ("Ordering at a Café"): in progress (45%),
  // matching mock-data.ts's continueLesson. Lessons 3-4: not started, so
  // "Asking for the Bill" naturally resolves as todaysLesson (next in
  // curriculum order with no progress row).
  await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId: user.id, lessonId: lessons[0].id } },
    update: { progress: 100 },
    create: { userId: user.id, lessonId: lessons[0].id, progress: 100 },
  });
  await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId: user.id, lessonId: lessons[1].id } },
    update: { progress: 45 },
    create: { userId: user.id, lessonId: lessons[1].id, progress: 45 },
  });

  // --- Skill scores ---
  const skillScores: { key: SkillKey; score: number }[] = [
    { key: "pronunciation", score: 78 },
    { key: "grammar", score: 64 },
    { key: "listening", score: 71 },
    { key: "reading", score: 82 },
    { key: "speaking", score: 58 },
    { key: "vocabulary", score: 88 },
  ];
  for (const s of skillScores) {
    await prisma.skillScoreSnapshot.upsert({
      where: { userId_skillKey: { userId: user.id, skillKey: s.key } },
      update: { score: s.score },
      create: { userId: user.id, skillKey: s.key, score: s.score },
    });
  }

  // --- Mistake logs (drives weakTopics) ---
  // Each topic needs enough attempts to clear MIN_ATTEMPTS_FOR_WEAK_TOPIC (3)
  // and an accuracy consistent with mock-data.ts's numbers.
  const mistakeTopics: { title: string; skill: SkillKey; attempts: number; mistakes: number }[] = [
    { title: "Passé composé vs. imparfait", skill: "grammar", attempts: 29, mistakes: 14 }, // ~52% accuracy
    { title: "Nasal vowel sounds (an, on, in)", skill: "pronunciation", attempts: 23, mistakes: 9 }, // ~61%
    { title: "Numbers 70-99", skill: "vocabulary", attempts: 21, mistakes: 7 }, // ~67%
  ];

  await prisma.mistakeLog.deleteMany({ where: { userId: user.id } });
  for (const topic of mistakeTopics) {
    const rows = Array.from({ length: topic.attempts }, (_, i) => ({
      userId: user.id,
      topicTitle: topic.title,
      skillKey: topic.skill,
      correct: i >= topic.mistakes, // first N attempts wrong, rest correct
      createdAt: daysAgo(topic.attempts - i),
    }));
    await prisma.mistakeLog.createMany({ data: rows });
  }

  // Additional vocabulary topics attempted (contributes to vocabularyLearned
  // distinct-topic count, approximating mock's 372 — see DashboardService
  // note on this being a placeholder metric).
  const extraVocabTopics = Array.from({ length: 368 }, (_, i) => `Vocabulary word set ${i + 1}`);
  await prisma.mistakeLog.createMany({
    data: extraVocabTopics.map((title) => ({
      userId: user.id,
      topicTitle: title,
      skillKey: "vocabulary" as SkillKey,
      correct: true,
      createdAt: daysAgo(1),
    })),
  });

  // --- Achievements catalog + user progress ---
  const achievementDefs = [
    { code: "streak_7", title: "7 Day Streak", description: "Studied 7 days in a row", icon: "flame" as const },
    { code: "pronunciation_perfect", title: "Perfect Pronunciation", description: "Score 100% on a pronunciation drill", icon: "mic" as const },
    { code: "vocab_master", title: "Vocabulary Master", description: "Learn 500 words", icon: "book" as const },
    { code: "streak_30", title: "30 Day Streak", description: "Studied 30 days in a row", icon: "trophy" as const },
    { code: "grammar_expert", title: "Grammar Expert", description: "Master passé composé and imparfait", icon: "target" as const },
    { code: "master_speaker", title: "Master Speaker", description: "Complete 50 speaking drills", icon: "medal" as const },
  ];

  const achievements = [];
  for (const def of achievementDefs) {
    const achievement = await prisma.achievement.upsert({
      where: { code: def.code },
      update: {},
      create: def,
    });
    achievements.push(achievement);
  }

  const userAchievementDefs = [
    { code: "streak_7", progress: 100, unlockedAt: daysAgo(11) },
    { code: "pronunciation_perfect", progress: 100, unlockedAt: daysAgo(6) },
    { code: "vocab_master", progress: 74, unlockedAt: null },
    { code: "streak_30", progress: 40, unlockedAt: null },
  ];
  for (const ua of userAchievementDefs) {
    const achievement = achievements.find((a) => a.code === ua.code)!;
    await prisma.userAchievement.upsert({
      where: { userId_achievementId: { userId: user.id, achievementId: achievement.id } },
      update: { progress: ua.progress, unlockedAt: ua.unlockedAt },
      create: {
        userId: user.id,
        achievementId: achievement.id,
        progress: ua.progress,
        unlockedAt: ua.unlockedAt,
      },
    });
  }

  // --- Daily activity: 12-day current streak + realistic week pattern ---
  // mock-data.ts: last7Days = [true, true, false, true, true, true, false]
  // (Mon-Sun), streak.current = 12, minutesToday = 8, goal = 15 min/day.
  await prisma.dailyActivity.deleteMany({ where: { userId: user.id } });

  const activityRows: { userId: string; date: Date; minutesStudied: number }[] = [];
  // Build a 40-day history: a 12-day active streak ending yesterday, with
  // today partially studied (8 of 15 min, so goal not yet met today,
  // matching mock's minutesToday: 8 without breaking the "current" streak
  // semantics documented in DashboardService.computeStreak).
  for (let i = 1; i <= 12; i++) {
    activityRows.push({ userId: user.id, date: daysAgo(i), minutesStudied: 18 });
  }
  activityRows.push({ userId: user.id, date: daysAgo(0), minutesStudied: 8 });
  // Older sparse history so "longest" streak (34, per mock) is derivable.
  for (let i = 13; i <= 50; i++) {
    const withinOldStreak = i >= 15 && i <= 48; // a 34-day block further back
    activityRows.push({
      userId: user.id,
      date: daysAgo(i),
      minutesStudied: withinOldStreak ? 20 : 0,
    });
  }

  await prisma.dailyActivity.createMany({ data: activityRows });

  // --- XP transactions ---
  await prisma.xpTransaction.deleteMany({ where: { userId: user.id } });
  await prisma.xpTransaction.createMany({
    data: [
      { userId: user.id, amount: 8360, reason: "historical_backfill", createdAt: daysAgo(30) },
      { userId: user.id, amount: 60, reason: "lesson_complete", createdAt: new Date() },
    ],
  });

  // --- Upcoming exam ---
  await prisma.exam.upsert({
    where: { id: "seed-exam-a2" },
    update: {},
    create: {
      id: "seed-exam-a2",
      level: "A2",
      title: "A2 Certification Exam",
      availableFrom: new Date("2026-07-15T00:00:00.000Z"),
      sectionsTotal: 7,
      sectionsReady: 5,
    },
  });

  // --- Vocabulary catalog (reproduces src/lib/mock-vocabulary.ts) ---
  // Uses deterministic ids (seed-voc-N) so upsert is idempotent across
  // re-seeds, same convention as units/lessons above.
  const vocabularyDefs: {
    id: string;
    french: string;
    english: string;
    gender: WordGender | null;
    partOfSpeech: PartOfSpeech;
    pronunciationIpa: string;
    exampleFr: string;
    exampleEn: string;
    synonyms: string[];
    commonMistake: string | null;
    level: CEFRLevel;
    unitTitle: string;
  }[] = [
    {
      id: "seed-voc-1",
      french: "Bonjour",
      english: "Hello / Good morning",
      gender: null,
      partOfSpeech: "expression",
      pronunciationIpa: "/bɔ̃.ʒuʁ/",
      exampleFr: "Bonjour, comment allez-vous ?",
      exampleEn: "Hello, how are you?",
      synonyms: ["Salut"],
      commonMistake: "Don't use \"Bonjour\" late in the evening — switch to \"Bonsoir\".",
      level: "A1",
      unitTitle: "Greetings",
    },
    {
      id: "seed-voc-2",
      french: "Le pain",
      english: "Bread",
      gender: "masculine",
      partOfSpeech: "noun",
      pronunciationIpa: "/lə pɛ̃/",
      exampleFr: "Je voudrais un peu de pain, s'il vous plaît.",
      exampleEn: "I would like some bread, please.",
      synonyms: [],
      commonMistake: "Learners often forget the nasal vowel in \"pain\" and pronounce it like \"pin\".",
      level: "A1",
      unitTitle: "Food & Dining",
    },
    {
      id: "seed-voc-3",
      french: "La maison",
      english: "House",
      gender: "feminine",
      partOfSpeech: "noun",
      pronunciationIpa: "/la mɛ.zɔ̃/",
      exampleFr: "Notre maison est près du parc.",
      exampleEn: "Our house is near the park.",
      synonyms: ["Le logement", "La demeure"],
      commonMistake: null,
      level: "A1",
      unitTitle: "Home & Places",
    },
    {
      id: "seed-voc-4",
      french: "Manger",
      english: "To eat",
      gender: null,
      partOfSpeech: "verb",
      pronunciationIpa: "/mɑ̃.ʒe/",
      exampleFr: "Nous allons manger au restaurant ce soir.",
      exampleEn: "We are going to eat at the restaurant tonight.",
      synonyms: ["Se nourrir"],
      commonMistake: "The \"ge\" keeps its soft sound before \"a\" — conjugated as \"nous mangeons\", not \"mangons\".",
      level: "A1",
      unitTitle: "Food & Dining",
    },
    {
      id: "seed-voc-5",
      french: "Merci beaucoup",
      english: "Thank you very much",
      gender: null,
      partOfSpeech: "expression",
      pronunciationIpa: "/mɛʁ.si bo.ku/",
      exampleFr: "Merci beaucoup pour votre aide.",
      exampleEn: "Thank you very much for your help.",
      synonyms: ["Merci mille fois"],
      commonMistake: null,
      level: "A1",
      unitTitle: "Greetings",
    },
    {
      id: "seed-voc-6",
      french: "L'addition",
      english: "The bill / check",
      gender: "feminine",
      partOfSpeech: "noun",
      pronunciationIpa: "/la.di.sjɔ̃/",
      exampleFr: "L'addition, s'il vous plaît.",
      exampleEn: "The bill, please.",
      synonyms: [],
      commonMistake: "Don't confuse with \"une addition\" in math — same word, context makes the meaning clear.",
      level: "A2",
      unitTitle: "Food & Dining",
    },
    {
      id: "seed-voc-7",
      french: "Quatre-vingts",
      english: "Eighty",
      gender: null,
      partOfSpeech: "adjective",
      pronunciationIpa: "/katʁ.vɛ̃/",
      exampleFr: "Il y a quatre-vingts personnes ici.",
      exampleEn: "There are eighty people here.",
      synonyms: [],
      commonMistake: "Numbers 70-99 use base-20 counting (\"four twenties\") — a common stumbling block for English speakers.",
      level: "A2",
      unitTitle: "Numbers",
    },
    {
      id: "seed-voc-8",
      french: "La sœur",
      english: "Sister",
      gender: "feminine",
      partOfSpeech: "noun",
      pronunciationIpa: "/la sœʁ/",
      exampleFr: "Ma sœur habite à Lyon.",
      exampleEn: "My sister lives in Lyon.",
      synonyms: [],
      commonMistake: null,
      level: "A1",
      unitTitle: "Family",
    },
    {
      id: "seed-voc-9",
      french: "Le billet",
      english: "Ticket",
      gender: "masculine",
      partOfSpeech: "noun",
      pronunciationIpa: "/lə bi.jɛ/",
      exampleFr: "J'ai perdu mon billet de train.",
      exampleEn: "I lost my train ticket.",
      synonyms: ["Le ticket"],
      commonMistake: "\"Billet\" is for trains/planes/shows; \"ticket\" is more for buses/metro in everyday French.",
      level: "A2",
      unitTitle: "Travel",
    },
    {
      id: "seed-voc-10",
      french: "Réserver",
      english: "To book / reserve",
      gender: null,
      partOfSpeech: "verb",
      pronunciationIpa: "/ʁe.zɛʁ.ve/",
      exampleFr: "Je voudrais réserver une table pour deux.",
      exampleEn: "I would like to book a table for two.",
      synonyms: [],
      commonMistake: null,
      level: "A2",
      unitTitle: "Travel",
    },
    {
      id: "seed-voc-11",
      french: "Difficile",
      english: "Difficult",
      gender: null,
      partOfSpeech: "adjective",
      pronunciationIpa: "/di.fi.sil/",
      exampleFr: "Cet examen était très difficile.",
      exampleEn: "This exam was very difficult.",
      synonyms: ["Compliqué", "Ardu"],
      commonMistake: null,
      level: "A2",
      unitTitle: "Adjectives",
    },
    {
      id: "seed-voc-12",
      french: "Toujours",
      english: "Always",
      gender: null,
      partOfSpeech: "adverb",
      pronunciationIpa: "/tu.ʒuʁ/",
      exampleFr: "Elle arrive toujours à l'heure.",
      exampleEn: "She always arrives on time.",
      synonyms: [],
      commonMistake: "Not to be confused with \"toujours\" meaning \"still\" in some contexts (\"il est toujours là\").",
      level: "A2",
      unitTitle: "Adverbs",
    },
    {
      id: "seed-voc-13",
      french: "L'hôpital",
      english: "The hospital",
      gender: "masculine",
      partOfSpeech: "noun",
      pronunciationIpa: "/lo.pi.tal/",
      exampleFr: "L'hôpital le plus proche est à dix minutes.",
      exampleEn: "The nearest hospital is ten minutes away.",
      synonyms: ["La clinique"],
      commonMistake: "The circumflex on \"ô\" replaces a historic \"s\" (Latin \"hospitalis\") — silent, doesn't change pronunciation length much.",
      level: "B1",
      unitTitle: "Health",
    },
    {
      id: "seed-voc-14",
      french: "Se dépêcher",
      english: "To hurry",
      gender: null,
      partOfSpeech: "verb",
      pronunciationIpa: "/sə de.pɛ.ʃe/",
      exampleFr: "Nous devons nous dépêcher, le train part bientôt.",
      exampleEn: "We need to hurry, the train leaves soon.",
      synonyms: ["Se presser"],
      commonMistake: "Reflexive verb — learners often drop the \"se\" and just say \"dépêcher\", which changes the meaning.",
      level: "B1",
      unitTitle: "Daily Routine",
    },
    {
      id: "seed-voc-15",
      french: "Néanmoins",
      english: "Nevertheless / however",
      gender: null,
      partOfSpeech: "adverb",
      pronunciationIpa: "/ne.ɑ̃.mwɛ̃/",
      exampleFr: "Le film était long ; néanmoins, il était captivant.",
      exampleEn: "The film was long; nevertheless, it was captivating.",
      synonyms: ["Cependant", "Toutefois"],
      commonMistake: "A formal/written-register connector — sounds stilted in casual spoken conversation.",
      level: "B1",
      unitTitle: "Connectors",
    },
  ];

  const vocabularyWords = [];
  for (const def of vocabularyDefs) {
    const word = await prisma.vocabularyWord.upsert({
      where: { id: def.id },
      update: { ...def },
      create: { ...def },
    });
    vocabularyWords.push(word);
  }

  // Give the demo user a realistic mix of per-word progress: a few
  // favorites, and a spread across new/learning/mastered so the endpoint
  // looks like real usage rather than a fresh empty state.
  const vocabProgressDefs: {
    wordId: string;
    isFavorite: boolean;
    masteryStatus: MasteryStatus;
    lastReviewedAt: Date | null;
  }[] = [
    { wordId: "seed-voc-1", isFavorite: true, masteryStatus: "mastered", lastReviewedAt: daysAgo(3) },
    { wordId: "seed-voc-2", isFavorite: false, masteryStatus: "learning", lastReviewedAt: daysAgo(2) },
    { wordId: "seed-voc-3", isFavorite: false, masteryStatus: "mastered", lastReviewedAt: daysAgo(11) },
    { wordId: "seed-voc-4", isFavorite: true, masteryStatus: "learning", lastReviewedAt: daysAgo(1) },
    { wordId: "seed-voc-5", isFavorite: false, masteryStatus: "mastered", lastReviewedAt: daysAgo(16) },
    { wordId: "seed-voc-6", isFavorite: false, masteryStatus: "new", lastReviewedAt: null },
    { wordId: "seed-voc-7", isFavorite: false, masteryStatus: "learning", lastReviewedAt: daysAgo(4) },
    { wordId: "seed-voc-8", isFavorite: false, masteryStatus: "mastered", lastReviewedAt: daysAgo(21) },
    { wordId: "seed-voc-9", isFavorite: true, masteryStatus: "learning", lastReviewedAt: daysAgo(2) },
    { wordId: "seed-voc-10", isFavorite: false, masteryStatus: "new", lastReviewedAt: null },
    { wordId: "seed-voc-11", isFavorite: false, masteryStatus: "learning", lastReviewedAt: daysAgo(5) },
    { wordId: "seed-voc-12", isFavorite: false, masteryStatus: "new", lastReviewedAt: null },
    // seed-voc-13/14/15 (B1) intentionally left with no progress row at all,
    // to exercise the "no row yet -> default new/false/null" join path.
  ];

  for (const p of vocabProgressDefs) {
    await prisma.userVocabularyProgress.upsert({
      where: { userId_wordId: { userId: user.id, wordId: p.wordId } },
      update: {
        isFavorite: p.isFavorite,
        masteryStatus: p.masteryStatus,
        lastReviewedAt: p.lastReviewedAt,
      },
      create: {
        userId: user.id,
        wordId: p.wordId,
        isFavorite: p.isFavorite,
        masteryStatus: p.masteryStatus,
        lastReviewedAt: p.lastReviewedAt,
      },
    });
  }

  console.log(`Seeded ${vocabularyWords.length} vocabulary words with demo progress.`);

  console.log("Seed complete.");
  console.log(`Demo login: email=camille@frenchmaster.dev password=Password123`);
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
