# Backend API Contract — Vocabulary (v1)

Companion to [`BACKEND_API_CONTRACT.md`](./BACKEND_API_CONTRACT.md) (Dashboard).
Same pattern: frontend is built and demoable against the static fixture in
[`src/lib/mock-vocabulary.ts`](../src/lib/mock-vocabulary.ts), typed by
[`src/types/index.ts`](../src/types/index.ts) (`VocabularyWord`,
`VocabularyStats`, `VocabularyListResponse`). Treat those as the source of
truth for shape; this doc explains intent and interaction semantics.

## Screen this backs

`/vocabulary` — a browsable word list with search, level/favorite/due
filters, a stats bar, and a detail dialog per word (pronunciation, example
sentence with translation toggle, synonyms, a "common mistake" callout,
favorite toggle, and a "mark as reviewed" action that advances mastery).

## Endpoints needed

### `GET /api/vocabulary`

```
Authorization: Bearer <JWT access token>
Query params (all optional):
  level: "A1" | "A2" | "B1" | "B2"
  favoritesOnly: boolean
  dueOnly: boolean          (masteryStatus != "mastered")
  search: string            (matches french, english, or unitTitle, case-insensitive)
```

Returns:

```ts
interface VocabularyListResponse {
  words: VocabularyWord[];
  stats: VocabularyStats; // { total, mastered, favorites, dueForReview }
}
```

The frontend currently does search/filtering client-side over the full
fixture (12 words). Whether filtering should move server-side (with real
pagination) depends entirely on how large the real vocabulary set gets —
see open question below. Either way, **`stats` must reflect the user's
full vocabulary set, not just the filtered/paginated page** — the stats bar
renders totals regardless of active filters.

### `POST /api/vocabulary/:id/favorite`

Toggles `isFavorite` for that word for the current user. Returns the
updated `VocabularyWord`. No request body needed (toggle, not set).

### `POST /api/vocabulary/:id/review`

Called when the user taps "Mark as Reviewed" in the detail dialog. Current
frontend behavior (see `vocabulary-explorer.tsx`): advances
`new → learning → mastered` one step per call, and sets `lastReviewedAt` to
now. Returns the updated `VocabularyWord`. The button is disabled once a
word is already `mastered`, so the backend never needs to handle
"mastered → mastered" — but should probably no-op safely if it ever does.

## Field semantics carried over from the mock

- `gender` is `null` for anything that isn't a noun (verbs, adjectives,
  adverbs, phrases, expressions never have a gender).
- `audioUrl` and `imageUrl` are both nullable — **no TTS or image pipeline
  exists yet** (that's the "Speech Engine" / "Storage" work in CLAUDE.md,
  out of scope here). The frontend already renders correctly for `null`
  (disabled play button, placeholder image block), so the backend can
  ship with every word's `audioUrl`/`imageUrl` as `null` and it'll look
  intentional, not broken.
- `synonyms` is a plain `string[]`, not a relation to other `VocabularyWord`
  rows — it's just display text, doesn't need to resolve to real word IDs.
- `commonMistake` is a single nullable string, not a list.
- `unitTitle` is a free-text category label for grouping/filtering (e.g.
  "Greetings", "Food & Dining") — doesn't need to be a foreign key to the
  `Unit` table from the Dashboard contract, though it plausibly should be
  once curriculum content is unified (see open question).

## Auth

Same JWT bearer pattern as the dashboard endpoint. All three endpoints are
per-user (favorite/mastery state is scoped to the authenticated user, not
global to the word).

## Open questions for backend design

1. **Real vocabulary set size.** 12 words is a placeholder. If the real
   catalog is in the thousands, `GET /api/vocabulary` needs real pagination
   and probably server-side filtering — the current "return everything,
   filter client-side" contract won't scale. Worth deciding before building
   this for real rather than after.
2. **Should `VocabularyWord` reuse the `Unit`/`Lesson` tables from the
   dashboard schema**, or is vocabulary a separate content system with its
   own categorization? They're conceptually related (a lesson teaches a set
   of vocabulary words) but nothing in the dashboard contract currently
   links them.
3. **Mastery/SRS model.** The frontend's `new → learning → mastered` on
   manual button-tap is a placeholder, not real spaced repetition. CLAUDE.md's
   "Vocabulary" section calls for "Review Later" as a distinct concept from
   mastery, and the separate `/practice` section (not yet built) is where
   CLAUDE.md's actual spaced-repetition requirement likely belongs. Worth
   deciding whether vocabulary mastery state lives here or gets pulled into
   a shared SRS engine that also serves `/practice`, before building
   `POST /api/vocabulary/:id/review` for real.
4. **Where does "dueForReview" really come from?** Right now it's simply
   "not yet mastered," with no actual due-date/interval logic. If real SRS
   is introduced (see #3), this should probably become "next-review-date
   <= today" instead.
