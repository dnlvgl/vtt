# VTT (Virtual Tabletop) - Implementation Plan

## Context

Building a web-based virtual tabletop application for pen-and-paper RPG sessions. The core need: a shared infinite canvas where a GM and players collaborate in real-time -- placing notes, images, and PDFs -- with a sidebar for dice rolling and PDF reading. The GM can stage hidden assets and reveal them during play to prevent spoilers.

## Technical Stack

| Layer | Choice |
|-------|--------|
| Monorepo | Turborepo + pnpm |
| Frontend | React 19 + Vite 6 + TypeScript |
| UI | Radix UI + CSS Modules |
| Backend | Fastify 5 + TypeScript |
| Database | SQLite via better-sqlite3 + Drizzle ORM |
| Real-time | WebSockets via @fastify/websocket |
| File storage | Local filesystem (TODO: migrate to S3) |
| State mgmt | Zustand 5 (with immer middleware) |
| Canvas | react-zoom-pan-pinch (viewport) + react-rnd (drag/resize) |
| PDF | react-pdf (pdf.js wrapper) |
| Routing | react-router 7 |
| IDs | nanoid |
| Validation | zod (shared between front/back) |

## Monorepo Structure

```
vtt/
├── apps/
│   ├── web/                    # React + Vite frontend
│   │   └── src/
│   │       ├── components/
│   │       │   ├── canvas/     # Canvas, CanvasObject, StickyNote, ImageObject, PdfThumbnail
│   │       │   ├── sidebar/    # Sidebar, ChatPanel, DiceRoller, PdfViewer
│   │       │   ├── room/       # CreateRoom, JoinRoom, GmDashboard
│   │       │   ├── toolbar/    # Toolbar
│   │       │   └── ui/         # Shared UI components (built on Radix UI primitives)
│   │       ├── hooks/          # useWebSocket, useCanvas, useDice, useRoom
│   │       ├── stores/         # canvasStore, roomStore, chatStore, uiStore (Zustand)
│   │       ├── lib/            # ws.ts (WebSocket manager), utils
│   │       └── pages/          # HomePage, RoomPage, GmDashboardPage
│   └── server/                 # Fastify backend
│       └── src/
│           ├── plugins/        # database, websocket, multipart
│           ├── routes/         # rooms, assets, ws
│           ├── services/       # roomService, assetService, canvasService, chatService, wsManager
│           ├── db/             # schema.ts, index.ts, migrate.ts
│           └── handlers/       # wsHandlers.ts
├── packages/
│   └── shared/                 # @vtt/shared
│       └── src/
│           ├── types/          # room, canvas, chat, ws, asset types
│           ├── dice.ts         # Dice parser + roller
│           └── constants.ts
├── turbo.json
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

## Database Schema (Drizzle/SQLite)

**rooms** - `id`, `code` (6-char join code), `name`, `gmSecret` (GM auth token), `createdAt`

**participants** - `id`, `roomId`, `name`, `isGm`, `sessionToken` (for reconnection), `lastSeen`

**assets** - `id`, `roomId`, `filename`, `storagePath`, `mimeType`, `sizeBytes`, `uploadedBy`, `createdAt`

**whiteboard_objects** - `id`, `roomId`, `type` (sticky_note|image|pdf), `x`, `y`, `width`, `height`, `zIndex`, `content`, `assetId`, `hiddenFromPlayers`, `style` (JSON), `createdBy`, `createdAt`, `updatedAt`

**chat_messages** - `id`, `roomId`, `senderId`, `senderName`, `type` (text|dice_roll), `content`, `diceFormula`, `diceResults` (JSON), `createdAt`

## WebSocket Protocol

All messages follow a `{ type, payload }` envelope defined in `@vtt/shared`.

### Client -> Server
| Type | Purpose |
|------|---------|
| `join_room` | Authenticate and join via session token |
| `object_create` | Add whiteboard object (sticky note, image, PDF) |
| `object_update` | Move/resize/edit an object |
| `object_delete` | Remove an object |
| `object_reveal` | GM reveals a hidden object to players |
| `object_hide` | GM hides an object from players |
| `chat_message` | Send a text message |
| `dice_roll` | Send a dice formula (e.g., "2w6+3") |

### Server -> Client
| Type | Purpose |
|------|---------|
| `room_state` | Full snapshot on join (objects, messages, participants) |
| `participant_joined/left` | Player presence updates |
| `object_created/updated/deleted` | Whiteboard sync |
| `object_revealed` | Full object sent to players on reveal |
| `object_hidden` | Object removed from player view |
| `chat_broadcast` | Chat or dice result broadcast |
| `error` | Error response with code and message |

**Conflict resolution:** Last-Write-Wins. Objects are coarse-grained (position, size, content) and rarely concurrently edited. CRDTs are unnecessary overhead for this use case.

**State sync:** Full snapshot on join. Room state (objects + last 100 messages) fits a single WebSocket frame.

## Room Management

- **Homepage** has two paths: "Player" (join by code) and "Game Master" (links to `/gm` dashboard)
- **GM Dashboard (`/gm`):** Lists all rooms from `GET /api/rooms`. Create new rooms, enter existing ones, delete rooms. No auth required — trust-based for now.
- **Create:** `POST /api/rooms` -> generates 6-char code (unambiguous alphabet: no 0/O/1/I/L) + GM secret token
- **List:** `GET /api/rooms` -> returns all rooms with participant counts
- **Delete:** `DELETE /api/rooms/:id` -> cascade deletes room + all related data
- **Join:** `POST /api/rooms/:code/join` -> creates participant, returns session token
- **Connect:** WebSocket at `/ws/:code?token=<sessionToken>` -> server sends `room_state`
- **Auth:** Trust-based for now. No user accounts. Auth will be added later.

## Canvas Architecture

- **Viewport:** `react-zoom-pan-pinch` wraps the canvas content in a CSS `transform: scale() translate()`. Objects remain interactive DOM elements (not canvas pixels).
- **Objects:** Each whiteboard object wrapped in `react-rnd` for drag + resize. The `scale` prop on `<Rnd>` must match viewport zoom for correct pixel-to-world coordinate conversion.
- **Store:** `canvasStore` uses `Record<string, WhiteboardObject>` (map by ID) for O(1) updates. Fine-grained Zustand selectors (`useCanvasStore(s => s.objects[id])`) prevent full-canvas re-renders.
- **Updates:** `onDragStop`/`onResizeStop` send WebSocket `object_update`. No intermediate position streaming during drag (future enhancement).

## Dice System

Parser in `@vtt/shared` supports: `2w6+3`, `1w100`, `1d20+1d6+5` (both `w` and `d` notation). Client sends formula to server; server rolls using `crypto.getRandomValues` (prevents cheating) and broadcasts the result with individual rolls and total.

## GM Visibility

- Hidden objects have `hiddenFromPlayers: true` in DB
- Server filters hidden objects from `room_state` for non-GM participants
- GM sees hidden objects with visual indicator (dashed border, "hidden" badge, reduced opacity)
- `object_reveal` broadcasts full object to players (first time they see it, with fade-in animation)
- `object_hide` removes object from player stores

## Implementation Phases

### Phase 1: Foundation (DONE)
Set up Turborepo monorepo, Fastify server with health endpoint, Vite + React frontend with CSS Modules, `@vtt/shared` package, Drizzle schema + SQLite, room creation/joining REST endpoints, home page with create/join UI, GM dashboard page (`/gm`) with room list/create/delete.
**Verify:** `turbo dev` starts both apps. Create a room via UI, join with code. GM dashboard lists all rooms.

### Phase 2: WebSocket + Chat
Add `@fastify/websocket`, implement `wsManager` with room-based connection tracking, `join_room`/`room_state` flow, chat message persistence and broadcast. Build sidebar with chat panel.
**Verify:** Two browser tabs in same room, send chat messages visible in both.

### Phase 3: Dice Rolling
Implement dice parser in `@vtt/shared`, server-side rolling with `crypto.getRandomValues`, `/dice` command detection in chat input, dice result rendering.
**Verify:** `/dice 2w6+3` shows rolled results to all players.

### Phase 4: Infinite Canvas + Sticky Notes
Install `react-zoom-pan-pinch` + `react-rnd`. Build canvas with pan/zoom, `CanvasObject` wrapper, `StickyNote` component. Wire create/update/delete through WebSocket.
**Verify:** Two browsers -- add/move/resize/delete sticky notes, synced in real-time.

### Phase 5: Image Upload
Add `@fastify/multipart` + `@fastify/static`. Build file upload endpoint, `ImageObject` component, upload toolbar button.
**Verify:** Upload image, appears on canvas, drag/resize, visible to other players.

### Phase 6: PDF Upload + Viewer
Configure `react-pdf` with pdf.js worker. Build `PdfThumbnail` (canvas) and `PdfViewer` (sidebar). Click thumbnail to open full viewer.
**Verify:** Upload PDF, thumbnail on canvas, click to read in sidebar with page navigation.

### Phase 7: GM Visibility Control
Add hidden toggle on object creation (GM only), server-side filtering, reveal/hide WebSocket handlers, GM-specific UI indicators, context menu actions.
**Verify:** GM creates hidden asset, player doesn't see it, GM reveals, player sees it appear.

### Phase 8: Polish
WebSocket reconnection with exponential backoff, optimistic updates, z-index management (bring to front/send to back), loading states, error toasts, room cleanup timer.
