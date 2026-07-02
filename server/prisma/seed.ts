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
  // Modeled on TEF Canada's real 4 sections (see docs/EXAM_STRUCTURE.md) —
  // reading/listening comprehension are auto-graded MCQ, writing/speaking
  // are human-graded. Only reading + listening have a question seeded here
  // (making them "ready"); writing/speaking are left empty to demonstrate
  // partial content-authoring progress, same spirit as the original
  // sectionsReady=5/sectionsTotal=7 placeholder this replaces.
  const a2Exam = await prisma.exam.upsert({
    where: { id: "seed-exam-a2" },
    update: {},
    create: {
      id: "seed-exam-a2",
      level: "A2",
      title: "A2 Certification Exam",
      description: "DELF/TEF Canada-style certification exam for A2 level.",
      availableFrom: new Date("2026-07-15T00:00:00.000Z"),
      published: true,
    },
  });

  const examSections = [
    { id: "seed-exsec-reading", type: "READING_COMPREHENSION" as const, title: "Compréhension écrite", durationMinutes: 60, maxScore: 300, order: 1 },
    { id: "seed-exsec-writing", type: "WRITING_EXPRESSION" as const, title: "Expression écrite", durationMinutes: 60, maxScore: 450, order: 2 },
    { id: "seed-exsec-listening", type: "LISTENING_COMPREHENSION" as const, title: "Compréhension orale", durationMinutes: 40, maxScore: 360, order: 3 },
    { id: "seed-exsec-speaking", type: "SPEAKING_EXPRESSION" as const, title: "Expression orale", durationMinutes: 15, maxScore: 450, order: 4 },
  ];
  for (const s of examSections) {
    await prisma.examSection.upsert({
      where: { id: s.id },
      update: {},
      create: { ...s, examId: a2Exam.id },
    });
  }

  await prisma.examQuestion.upsert({
    where: { id: "seed-exq-reading-1" },
    update: {},
    create: {
      id: "seed-exq-reading-1",
      sectionId: "seed-exsec-reading",
      type: "multiple_choice",
      prompt: "D'après le texte, à quelle heure le magasin ouvre-t-il le samedi ?",
      passageText: "Le magasin est ouvert du lundi au vendredi de 9h à 18h. Le samedi, l'ouverture est retardée à 10h, et le magasin est fermé le dimanche.",
      options: ["9h", "10h", "18h", "Fermé"],
      correctAnswer: "10h",
      points: 6,
      order: 1,
    },
  });

  await prisma.examQuestion.upsert({
    where: { id: "seed-exq-listening-1" },
    update: {},
    create: {
      id: "seed-exq-listening-1",
      sectionId: "seed-exsec-listening",
      type: "multiple_choice",
      prompt: "Quel jour la réunion a-t-elle été déplacée ?",
      audioUrl: null,
      options: ["Lundi", "Mardi", "Jeudi", "Vendredi"],
      correctAnswer: "Jeudi",
      points: 6,
      order: 1,
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

  // --- Gold-standard A1 lesson: "Bonjour" (Unit 1 · Greetings) ---
  // Proves the full lesson-content pattern (vocabulary, grammar,
  // conversation, reading, listening, exercises) end-to-end before scaling
  // it across the rest of the A1-B2 curriculum. See
  // src/services/lesson.service.ts for how this is served.
  const greetingsUnit = await prisma.unit.upsert({
    where: { id: "seed-unit-a1-u1" },
    update: {},
    create: {
      id: "seed-unit-a1-u1",
      title: "Unit 1 · Greetings",
      description: "Learn to greet people formally and informally in French",
      level: "A1",
      order: 1,
    },
  });

  const bonjourLesson = await prisma.lesson.upsert({
    where: { id: "seed-lsn-a1-u1-l1" },
    update: {},
    create: {
      id: "seed-lsn-a1-u1-l1",
      unitId: greetingsUnit.id,
      title: "Bonjour",
      subtitle: "Formal and informal greetings",
      level: "A1",
      order: 1,
      estimatedMinutes: 15,
    },
  });

  const greetingsVocab: {
    id: string;
    french: string;
    english: string;
    gender: WordGender | null;
    partOfSpeech: PartOfSpeech;
    ipa: string;
    exampleFr: string;
    exampleEn: string;
    synonyms: string[];
    commonMistake: string | null;
  }[] = [
    { id: "seed-voc-bonjour", french: "Bonjour", english: "Hello / Good morning", gender: null, partOfSpeech: "expression", ipa: "/bɔ̃.ʒuʁ/", exampleFr: "Bonjour, comment allez-vous ?", exampleEn: "Hello, how are you?", synonyms: ["Salut"], commonMistake: "Don't use \"Bonjour\" late in the evening — switch to \"Bonsoir\"." },
    { id: "seed-voc-bonsoir", french: "Bonsoir", english: "Good evening", gender: null, partOfSpeech: "expression", ipa: "/bɔ̃.swaʁ/", exampleFr: "Bonsoir, Madame Lefevre.", exampleEn: "Good evening, Mrs. Lefevre.", synonyms: [], commonMistake: null },
    { id: "seed-voc-salut", french: "Salut", english: "Hi / Bye (informal)", gender: null, partOfSpeech: "expression", ipa: "/sa.ly/", exampleFr: "Salut ! Ça va ?", exampleEn: "Hi! How's it going?", synonyms: ["Coucou"], commonMistake: "Only use with friends and family — too casual for formal settings." },
    { id: "seed-voc-au-revoir", french: "Au revoir", english: "Goodbye", gender: null, partOfSpeech: "expression", ipa: "/o ʁə.vwaʁ/", exampleFr: "Au revoir, à demain !", exampleEn: "Goodbye, see you tomorrow!", synonyms: [], commonMistake: null },
    { id: "seed-voc-comment-allez-vous", french: "Comment allez-vous ?", english: "How are you? (formal)", gender: null, partOfSpeech: "expression", ipa: "/kɔ.mɑ̃ t‿a.le vu/", exampleFr: "Bonjour Monsieur, comment allez-vous ?", exampleEn: "Hello sir, how are you?", synonyms: [], commonMistake: "Only use \"vous\" here with strangers, elders, or in professional settings." },
    { id: "seed-voc-comment-ca-va", french: "Comment ça va ?", english: "How's it going? (informal)", gender: null, partOfSpeech: "expression", ipa: "/kɔ.mɑ̃ sa va/", exampleFr: "Salut ! Comment ça va ?", exampleEn: "Hi! How's it going?", synonyms: ["Ça va ?"], commonMistake: null },
    { id: "seed-voc-enchante", french: "Enchanté(e)", english: "Nice to meet you", gender: null, partOfSpeech: "expression", ipa: "/ɑ̃.ʃɑ̃.te/", exampleFr: "Enchanté, je m'appelle Marc.", exampleEn: "Nice to meet you, my name is Marc.", synonyms: [], commonMistake: "Add an extra \"e\" (enchantée) if the speaker is a woman — pronunciation is the same." },
    { id: "seed-voc-madame", french: "Madame", english: "Madam / Mrs.", gender: "feminine", partOfSpeech: "noun", ipa: "/ma.dam/", exampleFr: "Excusez-moi, Madame.", exampleEn: "Excuse me, Madam.", synonyms: [], commonMistake: null },
    { id: "seed-voc-monsieur", french: "Monsieur", english: "Sir / Mr.", gender: "masculine", partOfSpeech: "noun", ipa: "/mə.sjø/", exampleFr: "Bonjour, Monsieur.", exampleEn: "Hello, Sir.", synonyms: [], commonMistake: "The spelling looks nothing like the pronunciation — it's \"muh-syuh\", not \"mon-see-ur\"." },
    { id: "seed-voc-sil-vous-plait", french: "S'il vous plaît", english: "Please (formal)", gender: null, partOfSpeech: "expression", ipa: "/sil vu plɛ/", exampleFr: "Un café, s'il vous plaît.", exampleEn: "A coffee, please.", synonyms: [], commonMistake: "The informal version is \"s'il te plaît\" (tu form) — don't mix the two." },
  ];

  for (const [index, w] of greetingsVocab.entries()) {
    const word = await prisma.vocabularyWord.upsert({
      where: { id: w.id },
      update: {},
      create: {
        id: w.id,
        french: w.french,
        english: w.english,
        gender: w.gender,
        partOfSpeech: w.partOfSpeech,
        pronunciationIpa: w.ipa,
        audioUrl: null,
        exampleFr: w.exampleFr,
        exampleEn: w.exampleEn,
        imageUrl: null,
        synonyms: w.synonyms,
        commonMistake: w.commonMistake,
        level: "A1",
        unitTitle: "Greetings",
      },
    });
    await prisma.lessonVocabulary.upsert({
      where: { lessonId_wordId: { lessonId: bonjourLesson.id, wordId: word.id } },
      update: {},
      create: { lessonId: bonjourLesson.id, wordId: word.id, order: index + 1 },
    });
  }

  const grammarPoint = await prisma.grammarPoint.upsert({
    where: { id: "seed-gp-tu-vous" },
    update: {},
    create: {
      id: "seed-gp-tu-vous",
      lessonId: bonjourLesson.id,
      title: "Tu vs. Vous — Formal and Informal \"You\"",
      explanation:
        'French has two ways to say "you": **tu** (informal) and **vous** (formal, or plural).\n\n' +
        "Use **tu** with:\n- Friends and family\n- Children\n- People your own age in casual settings\n\n" +
        "Use **vous** with:\n- Strangers\n- Elders or people in authority\n- Professional and formal settings\n- Anytime you are speaking to more than one person\n\n" +
        "When in doubt, start with **vous** — it is never rude to be too formal, but it can be rude to be too casual.",
      order: 1,
    },
  });

  const grammarExamples = [
    { id: "seed-ge-1", fr: "Tu es content ?", en: "Are you happy? (informal)" },
    { id: "seed-ge-2", fr: "Vous êtes content ?", en: "Are you happy? (formal)" },
    { id: "seed-ge-3", fr: "Comment vas-tu ?", en: "How are you? (informal)" },
    { id: "seed-ge-4", fr: "Comment allez-vous ?", en: "How are you? (formal)" },
  ];
  for (const [index, ex] of grammarExamples.entries()) {
    await prisma.grammarExample.upsert({
      where: { id: ex.id },
      update: {},
      create: {
        id: ex.id,
        grammarPointId: grammarPoint.id,
        frenchText: ex.fr,
        englishText: ex.en,
        order: index + 1,
      },
    });
  }

  const dialogue = await prisma.conversationDialogue.upsert({
    where: { id: "seed-dlg-office" },
    update: {},
    create: {
      id: "seed-dlg-office",
      lessonId: bonjourLesson.id,
      title: "Meeting a Colleague",
      context: "Office",
      order: 1,
    },
  });

  const dialogueLines = [
    { id: "seed-dl-1", speaker: "Sophie", fr: "Bonjour ! Je m'appelle Sophie.", en: "Hello! My name is Sophie." },
    { id: "seed-dl-2", speaker: "Marc", fr: "Enchanté, Sophie. Je suis Marc.", en: "Nice to meet you, Sophie. I'm Marc." },
    { id: "seed-dl-3", speaker: "Sophie", fr: "Comment allez-vous, Marc ?", en: "How are you, Marc?" },
    { id: "seed-dl-4", speaker: "Marc", fr: "Très bien, merci. Et vous ?", en: "Very well, thank you. And you?" },
    { id: "seed-dl-5", speaker: "Sophie", fr: "Très bien aussi, merci !", en: "Very well too, thank you!" },
  ];
  for (const [index, line] of dialogueLines.entries()) {
    await prisma.dialogueLine.upsert({
      where: { id: line.id },
      update: {},
      create: {
        id: line.id,
        dialogueId: dialogue.id,
        speaker: line.speaker,
        frenchText: line.fr,
        englishText: line.en,
        audioUrl: null,
        order: index + 1,
      },
    });
  }

  await prisma.readingPassage.upsert({
    where: { id: "seed-rp-cafe" },
    update: {},
    create: {
      id: "seed-rp-cafe",
      lessonId: bonjourLesson.id,
      title: "Une Rencontre au Café",
      bodyFr:
        "Le matin, Claire arrive au café. Elle voit son amie Isabelle. « Bonjour, Isabelle ! Comment vas-tu ? » demande Claire. « Très bien, merci ! Et toi ? » répond Isabelle. Les deux amies s'assoient et commandent un café. Elles parlent de leur semaine et rient beaucoup. C'est une belle matinée à Paris.",
      bodyEn:
        'In the morning, Claire arrives at the café. She sees her friend Isabelle. "Hello, Isabelle! How are you?" asks Claire. "Very well, thank you! And you?" replies Isabelle. The two friends sit down and order a coffee. They talk about their week and laugh a lot. It\'s a beautiful morning in Paris.',
      audioUrl: null,
    },
  });

  await prisma.listeningClip.upsert({
    where: { id: "seed-lc-office" },
    update: {},
    create: {
      id: "seed-lc-office",
      lessonId: bonjourLesson.id,
      title: "Greetings at the Office",
      audioUrl: null,
      transcriptFr:
        "— Bonjour, Monsieur Dupont. Comment allez-vous aujourd'hui ?\n— Très bien, merci. Et vous, Madame Lefevre ?\n— Ça va bien, merci beaucoup.",
      transcriptEn:
        "— Hello, Mr. Dupont. How are you today?\n— Very well, thank you. And you, Mrs. Lefevre?\n— I'm doing well, thank you very much.",
    },
  });

  const exercises: {
    id: string;
    type:
      | "multiple_choice"
      | "true_false"
      | "fill_blank"
      | "typing"
      | "speaking_prompt";
    prompt: string;
    options: string[];
    correctAnswer: string;
    skillKey: SkillKey;
    points: number;
  }[] = [
    { id: "seed-ex-1", type: "multiple_choice", prompt: 'How do you say "Hello" formally, any time of day?', options: ["Bonjour", "Bonsoir", "Salut", "Au revoir"], correctAnswer: "Bonjour", skillKey: "vocabulary", points: 10 },
    { id: "seed-ex-2", type: "multiple_choice", prompt: "Which greeting is informal, used only between friends?", options: ["Bonjour", "Comment allez-vous ?", "Salut", "Enchanté"], correctAnswer: "Salut", skillKey: "vocabulary", points: 10 },
    { id: "seed-ex-3", type: "true_false", prompt: '"Vous" is the right choice when speaking informally to a close friend.', options: ["True", "False"], correctAnswer: "False", skillKey: "grammar", points: 10 },
    { id: "seed-ex-4", type: "fill_blank", prompt: 'Complete the formal question: "Comment ___-vous ?"', options: [], correctAnswer: "allez", skillKey: "grammar", points: 10 },
    { id: "seed-ex-5", type: "multiple_choice", prompt: 'What does "Enchanté" mean?', options: ["Goodbye", "Nice to meet you", "Please", "Thank you"], correctAnswer: "Nice to meet you", skillKey: "vocabulary", points: 10 },
    { id: "seed-ex-6", type: "typing", prompt: 'Translate to French: "Good evening"', options: [], correctAnswer: "Bonsoir", skillKey: "vocabulary", points: 10 },
    { id: "seed-ex-7", type: "speaking_prompt", prompt: 'Say aloud: "Bonjour, comment allez-vous ?"', options: [], correctAnswer: "Bonjour, comment allez-vous ?", skillKey: "speaking", points: 15 },
  ];
  for (const [index, ex] of exercises.entries()) {
    await prisma.exercise.upsert({
      where: { id: ex.id },
      update: {},
      create: {
        id: ex.id,
        lessonId: bonjourLesson.id,
        type: ex.type,
        prompt: ex.prompt,
        options: ex.options,
        correctAnswer: ex.correctAnswer,
        audioUrl: null,
        imageUrl: null,
        skillKey: ex.skillKey,
        order: index + 1,
        points: ex.points,
      },
    });
  }

  console.log(`Seeded gold-standard lesson "${bonjourLesson.title}" with vocabulary, grammar, dialogue, reading, listening, and ${exercises.length} exercises.`);

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
