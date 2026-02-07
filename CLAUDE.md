# CLAUDE.md

## Project Overview

VTT (Virtual Tabletop) — a real-time collaborative web app for pen-and-paper RPG sessions. See PLAN.md for full architecture and implementation phases.

## Monorepo Layout

- `apps/web/` — React 19 + Vite 6 frontend (port 5173, proxies /api and /ws to server)
- `apps/server/` — Fastify 5 backend (port 3001)
- `packages/shared/` — `@vtt/shared` package: types, dice parser, constants (must be built before other packages can use it)

## Commands

- `pnpm install` — install all deps
- `pnpm dev` — starts both apps via Turborepo
- `cd packages/shared && npx tsc` — build shared package
- `cd apps/server && npx tsx src/index.ts` — run server directly
- `cd apps/web && npx vite build` — build frontend

## Key Conventions

- **TypeScript everywhere.** Strict mode enabled.
- **ESM only.** All packages use `"type": "module"`. Imports use `.js` extensions.
- **CSS Modules** for styling (no Tailwind). Files named `*.module.css`.
- **Zustand** for client state. Fine-grained selectors to avoid unnecessary re-renders.
- **better-sqlite3** (synchronous) via Drizzle ORM. DB file at `apps/server/data/vtt.db`.
- **Migrations** are raw SQL in `apps/server/src/db/migrate.ts` (runs on server start).
- **IDs** generated with `nanoid`.
- **Validation** with `zod` schemas defined in `@vtt/shared`.
- **WebSocket protocol:** `{ type, payload }` envelope. Types defined in `packages/shared/src/types/ws.ts`.

## Database

SQLite with WAL mode. Schema defined in both Drizzle format (`db/schema.ts`) and raw SQL (`db/migrate.ts`). Tables: rooms, participants, assets, whiteboard_objects, chat_messages.

## Dice Notation

Supports both `d` and `w` notation: `2w6+3`, `1d20+1d6+5`, `1w100`. Parser in `packages/shared/src/dice.ts`.
