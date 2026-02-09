# CLAUDE.md

## Project Overview

VTT (Virtual Tabletop) — a real-time collaborative web app for pen-and-paper RPG sessions. Shared infinite canvas where a GM and players place sticky notes, images, and PDFs, with a sidebar for chat and dice rolling. The GM can hide/reveal objects to prevent spoilers. All 8 implementation phases are complete.

## Monorepo Layout

- `apps/web/` — React 19 + Vite 6 frontend (port 5173, proxies /api, /uploads, /ws to server)
- `apps/server/` — Fastify 5 backend (port 3001)
- `packages/shared/` — `@vtt/shared` package: types, dice parser, constants (must be built before other packages can use it)

## Commands

- `pnpm install` — install all deps
- `pnpm dev` — starts both apps via Turborepo
- `cd packages/shared && npx tsc` — build shared package (required before type-checking apps)
- `cd apps/server && npx tsx src/index.ts` — run server directly
- `cd apps/web && npx vite build` — build frontend
- `cd apps/web && npx tsc --noEmit` — type-check frontend
- `cd apps/server && npx tsc --noEmit` — type-check server

## Key Conventions

- **TypeScript everywhere.** Strict mode enabled.
- **ESM only.** All packages use `"type": "module"`. Imports use `.js` extensions.
- **CSS Modules** for styling (no Tailwind). Files named `*.module.css`.
- **Zustand** for client state. Fine-grained selectors to avoid unnecessary re-renders (e.g. `useCanvasStore(s => s.objects[id])`).
- **better-sqlite3** (synchronous) via Drizzle ORM. DB file at `apps/server/data/vtt.db`.
- **Migrations** are raw SQL in `apps/server/src/db/migrate.ts` (runs on server start).
- **IDs** generated with `nanoid` (server-side only — not installed in web app).
- **Validation** with `zod` schemas defined in `@vtt/shared`.
- **WebSocket protocol:** `{ type, payload }` envelope. Types defined in `packages/shared/src/types/ws.ts`.
- **No Radix UI** despite being in PLAN.md — all UI is custom components with CSS Modules.
- **No immer middleware** — Zustand stores use plain state updates.

## Architecture

### Server Services (`apps/server/src/services/`)

| Service | Responsibility |
|---------|---------------|
| `roomService` | Room CRUD, participant management, join/leave, lastSeen tracking |
| `canvasService` | Whiteboard object CRUD, visibility toggling |
| `chatService` | Chat message persistence, dice roll results |
| `assetService` | Asset DB records, file tracking, deletion |
| `wsManager` | WebSocket connection registry, room-scoped broadcast |
| `cleanupService` | Hourly timer deletes idle rooms (no connections + all lastSeen > 24h) |

### Client Stores (`apps/web/src/stores/`)

| Store | State |
|-------|-------|
| `roomStore` | Room info, current participant, session token, GM secret, participant list, `isGm` flag |
| `canvasStore` | `objects: Record<string, WhiteboardObject>`, `selectedId` |
| `chatStore` | Chat message array |
| `uiStore` | Sidebar open/closed, active panel, PDF viewer asset ID |
| `toastStore` | Toast queue (max 5, auto-dismiss 4s), types: info/success/warning/error |

### WebSocket Module (`apps/web/src/lib/ws.ts`)

Module-level singleton with auto-reconnect (exponential backoff 1s-30s, jitter, max 20 attempts). Exposes `connectWs()`, `disconnectWs()`, `sendWs()`. Uses `onStatusChange(connected: boolean)` callback.

## HTTP API

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/rooms` | List all rooms |
| `POST` | `/api/rooms` | Create room |
| `DELETE` | `/api/rooms/:id` | Delete room + asset files |
| `POST` | `/api/rooms/:code/join` | Join room by code |
| `POST` | `/api/rooms/:code/assets` | Upload file (auth: `x-session-token` header) |
| `GET` | `/uploads/*` | Static file serving (via @fastify/static) |

## WebSocket Messages

**Client -> Server:** `join_room`, `object_create`, `object_update`, `object_delete`, `object_reveal`, `object_hide`, `chat_message`, `dice_roll`

**Server -> Client:** `room_state`, `participant_joined`, `participant_left`, `object_created`, `object_updated`, `object_deleted`, `object_revealed`, `object_hidden`, `chat_broadcast`, `error`

## Database

SQLite with WAL mode. Schema defined in both Drizzle format (`db/schema.ts`) and raw SQL (`db/migrate.ts`). Tables: `rooms`, `participants`, `assets`, `whiteboard_objects`, `chat_messages`. All foreign keys cascade on delete from `rooms`.

## Dice Notation

Supports both `d` and `w` notation: `2w6+3`, `1d20+1d6+5`, `1w100`. Parser in `packages/shared/src/dice.ts`. Chat commands: `/roll`, `/dice`, `/r`.

## Gotchas and Learnings

- **Shared package must be built first.** Run `cd packages/shared && npx tsc` before type-checking `apps/web` or `apps/server`. They import from `@vtt/shared` which resolves to the built `.d.ts` files.
- **React StrictMode double-mount.** Module-level singleton state (like the WebSocket connection in `ws.ts`) must guard against StrictMode calling mount twice. Close handlers from old instances can null out new instance references. Fix: capture `ws` in a local variable and check `socket === ws` before clearing.
- **Drizzle JSON columns.** The `diceResults` column uses `{ mode: "json" }` which returns `unknown` type. Need `as ChatMessage[]` cast when passing to typed interfaces.
- **@fastify/websocket v11.** Must `await app.register(fastifyWebsocket)` before defining routes. Handler signature is `(socket, request)`. The `{ websocket: true }` option on route augments types from the module.
- **nanoid is server-only.** The web app does not have `nanoid` installed. Use simple counters or `crypto.randomUUID()` for client-side IDs.
- **Canvas objects keyed by ID.** `canvasStore` uses `Record<string, WhiteboardObject>` for O(1) lookups/updates. Object arrays from the server are converted to this map on `room_state`.
- **Hidden objects.** GM sees all objects (with `hiddenFromPlayers` flag). Non-GM clients never receive hidden objects — the server filters them. When GM hides an object, non-GMs get `object_hidden` (removes it) while GMs get the flag update.
- **Asset cleanup.** When a canvas object with an `assetId` is deleted via WS, the server deletes both the DB record and the file from disk. Room deletion also cleans up all asset files.
- **Toast from outside React.** Use `useToastStore.getState().addToast()` to show toasts from non-component code (e.g. WS message handlers, upload callbacks).
