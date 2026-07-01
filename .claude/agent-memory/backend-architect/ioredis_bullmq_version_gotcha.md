---
name: ioredis-bullmq-dedupe-gotcha
description: Pin top-level ioredis to the exact version bullmq bundles, or TS structural typing breaks when passing a shared Redis connection into BullMQ
metadata:
  type: feedback
---

BullMQ bundles its own nested `ioredis` dependency. If the top-level
`ioredis` (installed directly, e.g. for a shared Redis client singleton) is
even a minor version off from BullMQ's bundled copy, npm won't dedupe them
into one install, and passing a top-level `Redis` instance into
`new Queue("x", { connection: redis })` or `new Worker(...)` fails
TypeScript structural typing with a deep, confusing error about
`AbstractConnector`/`protected connecting` mismatches — looks unrelated to
version drift at first glance.

**Why:** hit this in the FrenchMaster `server/` build —
`package.json` had `"ioredis": "^5.4.2"` which resolved to `5.11.1`, while
`bullmq`'s nested copy was pinned to `5.10.1`. Two separate installs, two
separate (structurally incompatible per TS) `Redis` classes.

**How to apply:** when a project uses both a standalone `ioredis` client
(e.g. for caching) AND `bullmq`, check `node_modules/bullmq/package.json`
for its exact `ioredis` version and pin the top-level dependency to that
exact version (not a caret range) so npm dedupes to a single copy:
`find node_modules -maxdepth 3 -name ioredis -type d` should show only one
result after `npm install`. Re-check this pin whenever bumping bullmq.
