# validation/

`validateCard(card, response)` looks up a validator by `card.type` and calls it,
returning a uniform `ValidationResult { isCorrect, score?, feedback? }`. It
contains **zero** card-type-specific logic — type names exist only as registry
keys inside `validators/*.ts`, never in `validateCard.ts`.

`validators/` holds one pure function per validating card type, each
self-registering into `validatorRegistry`. `validators/index.ts` imports them
all once. A card type with **no** registered validator is auto-passed by the
engine (display cards register nothing).

`isValidatingCard(card)` tells the renderer whether a card must be answered
before advancing — again by registry lookup, not by naming a type.

**Special seams:**
- `speaking.ts` returns a **placeholder** score and always passes — this is the
  documented seam where real speech recognition (Whisper/Deepgram/Google) will
  plug in later.
- `matching.ts` derives correctness from `content.pairs` (leftId === rightId),
  not a separate validation payload.

**Dependencies:** `registry/`, `utils/` (fuzzy match), `types/`.

**Extension point — add a validator:** create `validators/newCard.ts`
(self-registers) and add one import line to `validators/index.ts`.
