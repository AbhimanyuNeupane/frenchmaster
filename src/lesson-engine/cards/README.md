# cards/

One file per card type (21 today). Each file:

1. Defines a React component receiving the uniform `CardComponentProps`.
2. Self-registers into `componentRegistry` at module scope, wrapped in
   `React.lazy` so the renderer can `Suspense`-load it.

`index.ts` is the barrel that imports every card file for its registration side
effect. `_shared.tsx` and `_media.tsx` are internal helpers (note the leading
underscore) — they are **not** card types and are never in the barrel.

**Contract:** a card renders `card.content` and, if interactive, reports the
learner's RAW response through `onSubmit`. Cards never run validators, never
import the store, a content provider, or a persistence provider — everything
arrives through props. That prop boundary is the reuse boundary (a card is
portable to a future mobile renderer unchanged). Media is resolved only via
`useMediaService()`.

**Dependencies:** `registry/`, `hooks/useMediaService`, `types/`, shared UI
primitives in `@/components/ui`.

**Extension point — add a card type:** create `cards/NewCard.tsx` (self-registers)
and add one import line to `cards/index.ts`. If it validates, also add a
validator (see `validation/`). No engine file changes.
