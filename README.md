# VTT - Virtual Tabletop

A web-based virtual tabletop for pen-and-paper RPG sessions. Shared infinite canvas where a GM and players collaborate in real-time — placing sticky notes, images, and PDFs — with a sidebar for chat and dice rolling.

## Features

- **Infinite Canvas** — Pan, zoom, and place objects freely on a shared whiteboard
- **Sticky Notes** — Create and edit text notes with drag/resize support
- **Image Upload** — Upload and place images (PNG, JPEG, GIF, WebP, up to 50 MB)
- **PDF Support** — Upload PDFs, view thumbnails on canvas, open full viewer with page navigation
- **Real-time Sync** — All changes sync instantly via WebSockets with auto-reconnect
- **Chat & Dice Rolling** — Sidebar chat with built-in dice roller (`/roll 2d6+3` or `/r 1w20`)
- **GM Visibility Controls** — GM can hide/reveal canvas objects to prevent spoilers
- **Z-Index Management** — Bring objects to front or send to back
- **Room System** — Create rooms with join codes, multiple participants per room
- **Toast Notifications** — User-facing error and status feedback
- **Auto Cleanup** — Server cleans up idle rooms and orphaned asset files

## Tech Stack

| Layer | Choice |
|-------|--------|
| Monorepo | Turborepo + pnpm |
| Frontend | React 19 + Vite 6 + TypeScript |
| Styling | CSS Modules |
| Backend | Fastify 5 + TypeScript |
| Database | SQLite via better-sqlite3 + Drizzle ORM |
| Real-time | WebSockets via @fastify/websocket |
| State | Zustand 5 |
| Canvas | react-zoom-pan-pinch + react-rnd |
| PDF | react-pdf (pdf.js) |
| Routing | react-router 7 |

## Project Structure

```
apps/
  web/              React + Vite frontend
    src/
      components/   Canvas, Sidebar, Toast UI components
      pages/        HomePage, GmDashboardPage, RoomPage
      stores/       Zustand stores (room, canvas, chat, ui, toast)
      lib/          WebSocket client with auto-reconnect
      styles/       Global CSS
  server/           Fastify backend
    src/
      routes/       HTTP routes (rooms, assets) + WebSocket route
      services/     Business logic (room, canvas, chat, asset, ws, cleanup)
      db/           Drizzle schema + raw SQL migrations
    data/           SQLite DB + uploaded files (gitignored)
packages/
  shared/           @vtt/shared — types, dice parser, constants
```

## Development

```bash
pnpm install
pnpm dev          # starts server (:3001) and frontend (:5173)
```

The Vite dev server proxies `/api`, `/uploads`, and `/ws` to the backend.

## Room Flow

1. GM creates a room on the GM Dashboard (`/gm`) — gets a 6-char join code
2. Players visit the homepage (`/`) and join with the code + a display name
3. Everyone connects via WebSocket for real-time canvas, chat, and dice sync
4. GM can hide/reveal objects, all users can reorder z-index
5. Idle rooms with no connections for 24h are automatically cleaned up

## Dice Notation

Supports both `d` and `w` notation in chat:

```
/roll 2d6+3       # roll two six-sided dice plus 3
/r 1w20            # roll one twenty-sided die (German notation)
/dice 1d20+1d6+5   # roll multiple dice groups with modifier
```
