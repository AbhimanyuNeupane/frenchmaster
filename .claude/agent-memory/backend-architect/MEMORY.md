# Backend Architect Memory — FrenchMaster

- [FrenchMaster backend scope](project_frenchmaster_backend.md) — server/ only implements Dashboard + email auth; rest of CLAUDE.md is out of scope
- [Open design decisions](project_frenchmaster_open_decisions.md) — XP curve, timezone, sectionsReady, OAuth creds, storage provider all need human sign-off
- [Sandbox has no Docker/Postgres/Redis](env_constraints.md) — can't do full e2e verification in this environment, say so explicitly
- [tsc doesn't rewrite @/* aliases](ts_path_alias_build_gotcha.md) — need tsc-alias post-build step or compiled server crashes on boot
- [ioredis/bullmq version dedupe](ioredis_bullmq_version_gotcha.md) — pin top-level ioredis to bullmq's exact bundled version
