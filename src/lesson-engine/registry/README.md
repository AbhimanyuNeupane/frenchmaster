# registry/

The plugin mechanism. Two independent `Map<string, T>` registries keyed by the
card `type` string:

- `componentRegistry` — `type -> React component` (may be a `React.lazy` thunk).
- `validatorRegistry` — `type -> validator function`.

**Responsibilities:** register/get by type, nothing else. No React rendering, no
card-type knowledge, no language knowledge.

**Dependencies:** only `types/`.

**Why it exists:** so the renderer and validation engine resolve behavior by
string lookup instead of a `switch (card.type)`. An unregistered type returns
`undefined`, which the renderer treats as the Unknown-Card fallback and the
validation engine treats as an auto-pass.

**Extension point:** you never edit this folder to add a card type — cards and
validators register *into* it from their own files.
