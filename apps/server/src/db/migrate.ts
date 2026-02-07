import Database from "better-sqlite3";

const DB_PATH = process.env["DB_PATH"] ?? "data/vtt.db";

export function migrate(dbPath: string = DB_PATH) {
  const sqlite = new Database(dbPath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS rooms (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      gm_secret TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS participants (
      id TEXT PRIMARY KEY,
      room_id TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      is_gm INTEGER NOT NULL DEFAULT 0,
      session_token TEXT NOT NULL UNIQUE,
      last_seen TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS assets (
      id TEXT PRIMARY KEY,
      room_id TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
      filename TEXT NOT NULL,
      storage_path TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size_bytes INTEGER NOT NULL,
      uploaded_by TEXT NOT NULL REFERENCES participants(id),
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS whiteboard_objects (
      id TEXT PRIMARY KEY,
      room_id TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
      type TEXT NOT NULL CHECK(type IN ('sticky_note', 'image', 'pdf')),
      x REAL NOT NULL DEFAULT 0,
      y REAL NOT NULL DEFAULT 0,
      width REAL NOT NULL DEFAULT 200,
      height REAL NOT NULL DEFAULT 200,
      z_index INTEGER NOT NULL DEFAULT 0,
      content TEXT,
      asset_id TEXT REFERENCES assets(id),
      hidden_from_players INTEGER NOT NULL DEFAULT 0,
      style TEXT,
      created_by TEXT NOT NULL REFERENCES participants(id),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      room_id TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
      sender_id TEXT NOT NULL REFERENCES participants(id),
      sender_name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('text', 'dice_roll')),
      content TEXT NOT NULL,
      dice_formula TEXT,
      dice_results TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_participants_room ON participants(room_id);
    CREATE INDEX IF NOT EXISTS idx_participants_token ON participants(session_token);
    CREATE INDEX IF NOT EXISTS idx_assets_room ON assets(room_id);
    CREATE INDEX IF NOT EXISTS idx_whiteboard_objects_room ON whiteboard_objects(room_id);
    CREATE INDEX IF NOT EXISTS idx_chat_messages_room ON chat_messages(room_id);
    CREATE INDEX IF NOT EXISTS idx_rooms_code ON rooms(code);
  `);

  sqlite.close();
}
