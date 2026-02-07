import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const rooms = sqliteTable("rooms", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  gmSecret: text("gm_secret").notNull(),
  createdAt: text("created_at").notNull(),
});

export const participants = sqliteTable("participants", {
  id: text("id").primaryKey(),
  roomId: text("room_id")
    .notNull()
    .references(() => rooms.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  isGm: integer("is_gm", { mode: "boolean" }).notNull().default(false),
  sessionToken: text("session_token").notNull().unique(),
  lastSeen: text("last_seen").notNull(),
});

export const assets = sqliteTable("assets", {
  id: text("id").primaryKey(),
  roomId: text("room_id")
    .notNull()
    .references(() => rooms.id, { onDelete: "cascade" }),
  filename: text("filename").notNull(),
  storagePath: text("storage_path").notNull(),
  mimeType: text("mime_type").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  uploadedBy: text("uploaded_by")
    .notNull()
    .references(() => participants.id),
  createdAt: text("created_at").notNull(),
});

export const whiteboardObjects = sqliteTable("whiteboard_objects", {
  id: text("id").primaryKey(),
  roomId: text("room_id")
    .notNull()
    .references(() => rooms.id, { onDelete: "cascade" }),
  type: text("type", { enum: ["sticky_note", "image", "pdf"] }).notNull(),
  x: real("x").notNull().default(0),
  y: real("y").notNull().default(0),
  width: real("width").notNull().default(200),
  height: real("height").notNull().default(200),
  zIndex: integer("z_index").notNull().default(0),
  content: text("content"),
  assetId: text("asset_id").references(() => assets.id),
  hiddenFromPlayers: integer("hidden_from_players", { mode: "boolean" })
    .notNull()
    .default(false),
  style: text("style", { mode: "json" }).$type<Record<string, string>>(),
  createdBy: text("created_by")
    .notNull()
    .references(() => participants.id),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const chatMessages = sqliteTable("chat_messages", {
  id: text("id").primaryKey(),
  roomId: text("room_id")
    .notNull()
    .references(() => rooms.id, { onDelete: "cascade" }),
  senderId: text("sender_id")
    .notNull()
    .references(() => participants.id),
  senderName: text("sender_name").notNull(),
  type: text("type", { enum: ["text", "dice_roll"] }).notNull(),
  content: text("content").notNull(),
  diceFormula: text("dice_formula"),
  diceResults: text("dice_results", { mode: "json" }),
  createdAt: text("created_at").notNull(),
});
