# VTT - Virtual Tabletop

A web-based virtual tabletop for pen-and-paper RPG sessions. Shared infinite canvas where a GM and players collaborate in real-time — placing notes, images, and PDFs — with a sidebar for dice rolling and PDF reading.

## Tech Stack

- **Monorepo:** Turborepo + pnpm
- **Frontend:** React 19, Vite 6, TypeScript, Radix UI, CSS Modules
- **Backend:** Fastify 5, TypeScript
- **Database:** SQLite via better-sqlite3 + Drizzle ORM
- **Real-time:** WebSockets via @fastify/websocket
- **State:** Zustand 5
- **Canvas:** react-zoom-pan-pinch + react-rnd

## Structure

```
apps/web/       React + Vite frontend
apps/server/    Fastify backend
packages/shared @vtt/shared types, dice parser, constants
```

## Development

```bash
pnpm install
pnpm dev        # starts both server (:3001) and frontend (:5173)
```

## Room Flow

1. GM creates a room → gets a 6-char join code + GM secret
2. Players join with the code and a display name
3. Everyone connects via WebSocket for real-time sync
