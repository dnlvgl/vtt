import { resolve } from "node:path";
import Fastify from "fastify";
import fastifyWebsocket from "@fastify/websocket";
import fastifyMultipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import { existsSync, mkdirSync } from "node:fs";
import { MAX_FILE_SIZE } from "@vtt/shared";
import { createDb } from "./db/index.js";
import { migrate } from "./db/migrate.js";
import { createRoomService } from "./services/roomService.js";
import { createCanvasService } from "./services/canvasService.js";
import { createChatService } from "./services/chatService.js";
import { createAssetService } from "./services/assetService.js";
import { createWsManager } from "./services/wsManager.js";
import { roomRoutes } from "./routes/rooms.js";
import { assetRoutes } from "./routes/assets.js";
import { wsRoutes } from "./routes/ws.js";

const PORT = parseInt(process.env["PORT"] ?? "3001", 10);
const HOST = process.env["HOST"] ?? "0.0.0.0";
const DB_PATH = process.env["DB_PATH"] ?? "data/vtt.db";
const UPLOADS_DIR = resolve(process.env["UPLOADS_DIR"] ?? "uploads");

// Ensure data directory exists
const dataDir = DB_PATH.substring(0, DB_PATH.lastIndexOf("/"));
if (dataDir && !existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

// Ensure uploads directory exists
if (!existsSync(UPLOADS_DIR)) {
  mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Run migrations
migrate(DB_PATH);

// Create database connection and services
const db = createDb(DB_PATH);
const roomService = createRoomService(db);
const canvasService = createCanvasService(db);
const chatService = createChatService(db);
const assetService = createAssetService(db);
const wsManager = createWsManager();

const app = Fastify({ logger: true });

async function start() {
  try {
    // Register plugins
    await app.register(fastifyWebsocket);
    await app.register(fastifyMultipart, {
      limits: { fileSize: MAX_FILE_SIZE },
    });
    await app.register(fastifyStatic, {
      root: UPLOADS_DIR,
      prefix: "/uploads/",
    });

    // Health check
    app.get("/api/health", async () => ({ status: "ok" }));

    // Register routes
    roomRoutes(app, roomService);
    assetRoutes(app, { roomService, assetService, uploadsDir: UPLOADS_DIR });
    wsRoutes(app, { roomService, canvasService, chatService, wsManager });

    await app.listen({ port: PORT, host: HOST });
    console.log(`Server listening on http://${HOST}:${PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();

export { app, db, roomService, canvasService, chatService, assetService };
