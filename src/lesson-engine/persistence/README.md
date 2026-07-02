# persistence/

Saves/restores the lesson session outside the store.

- `types.ts` — the `PersistenceProvider` interface (`save/load/clear`) + the
  storage key.
- `localStorageProvider.ts` — today's SSR-safe `localStorage` implementation.
- `attachPersistence.ts` — **opt-in** wiring: hydrates the store once, then
  subscribes and writes changes back (debounced).

**Design point:** persistence is opt-in, not a hard dependency. The engine works
even if `attachPersistence` is never called — the store never reaches out for
persistence itself. The demo calls it once from the host layout.

**Dependencies:** `store/`, `types/`.

**Extension point — go cloud:** implement `PersistenceProvider` (e.g.
`ApiPersistenceProvider` doing a debounced POST to a sync endpoint) and pass it
as `attachPersistence({ provider })`. Nothing in `store/` or `engine/` changes.
