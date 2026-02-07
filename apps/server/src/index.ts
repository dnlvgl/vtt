import Fastify from "fastify";
import fastifyWebsocket from "@fastify/websocket";
import { existsSync, mkdirSync } from "node:fs";
import { createDb } from "./db/index.js";
import { migrate } from "./db/migrate.js";
import { createRoomService } from "./services/roomService.js";
import { createCanvasService } from "./services/canvasService.js";
import { createChatService } from "./services/chatService.js";
import { createWsManager } from "./services/wsManager.js";
import { roomRoutes } from "./routes/rooms.js";
import { wsRoutes } from "./routes/ws.js";

const PORT = parseInt(process.env["PORT"] ?? "3001", 10);
const HOST = process.env["HOST"] ?? "0.0.0.0";
const DB_PATH = process.env["DB_PATH"] ?? "data/vtt.db";

// Ensure data directory exists
const dataDir = DB_PATH.substring(0, DB_PATH.lastIndexOf("/"));
if (dataDir && !existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

// Run migrations
migrate(DB_PATH);

// Create database connection and services
const db = createDb(DB_PATH);
const roomService = createRoomService(db);
const canvasService = createCanvasService(db);
const chatService = createChatService(db);
const wsManager = createWsManager();

const app = Fastify({ logger: true });

async function start() {
  try {
    // Register WebSocket plugin
    await app.register(fastifyWebsocket);

    // Health check
    app.get("/api/health", async () => ({ status: "ok" }));

    // Register routes
    roomRoutes(app, roomService);
    wsRoutes(app, { roomService, canvasService, chatService, wsManager });

    await app.listen({ port: PORT, host: HOST });
    console.log(`Server listening on http://${HOST}:${PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();

export { app, db, roomService, canvasService, chatService };
