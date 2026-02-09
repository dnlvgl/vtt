import { eq, sql, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import { ROOM_CODE_ALPHABET, ROOM_CODE_LENGTH } from "@vtt/shared";
import type { RoomSummary } from "@vtt/shared";
import type { Db } from "../db/index.js";
import { schema } from "../db/index.js";

function generateCode(): string {
  let code = "";
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    code += ROOM_CODE_ALPHABET[Math.floor(Math.random() * ROOM_CODE_ALPHABET.length)];
  }
  return code;
}

export function createRoomService(db: Db) {
  return {
    createRoom(name: string) {
      const id = nanoid();
      const code = generateCode();
      const gmSecret = nanoid(32);
      const now = new Date().toISOString();

      db.insert(schema.rooms)
        .values({ id, code, name, gmSecret, createdAt: now })
        .run();

      const participantId = nanoid();
      const sessionToken = nanoid(32);
      db.insert(schema.participants)
        .values({
          id: participantId,
          roomId: id,
          name: "Game Master",
          isGm: true,
          sessionToken,
          lastSeen: now,
        })
        .run();

      return {
        room: { id, code, name, createdAt: now },
        gmSecret,
        sessionToken,
        participant: {
          id: participantId,
          roomId: id,
          name: "Game Master",
          isGm: true,
          lastSeen: now,
        },
      };
    },

    joinRoom(code: string, name: string, isGm?: boolean) {
      const room = db
        .select()
        .from(schema.rooms)
        .where(eq(schema.rooms.code, code.toUpperCase()))
        .get();

      if (!room) return null;

      const participantId = nanoid();
      const sessionToken = nanoid(32);
      const now = new Date().toISOString();

      db.insert(schema.participants)
        .values({
          id: participantId,
          roomId: room.id,
          name,
          isGm: !!isGm,
          sessionToken,
          lastSeen: now,
        })
        .run();

      return {
        room: {
          id: room.id,
          code: room.code,
          name: room.name,
          createdAt: room.createdAt,
        },
        sessionToken,
        participant: {
          id: participantId,
          roomId: room.id,
          name,
          isGm: !!isGm,
          lastSeen: now,
        },
      };
    },

    getRoomByCode(code: string) {
      return db
        .select()
        .from(schema.rooms)
        .where(eq(schema.rooms.code, code.toUpperCase()))
        .get();
    },

    getParticipantByToken(sessionToken: string) {
      return db
        .select()
        .from(schema.participants)
        .where(eq(schema.participants.sessionToken, sessionToken))
        .get();
    },

    getParticipants(roomId: string) {
      return db
        .select()
        .from(schema.participants)
        .where(eq(schema.participants.roomId, roomId))
        .all();
    },

    updateLastSeen(participantId: string) {
      db.update(schema.participants)
        .set({ lastSeen: new Date().toISOString() })
        .where(eq(schema.participants.id, participantId))
        .run();
    },

    listRooms(): RoomSummary[] {
      const rows = db
        .select({
          id: schema.rooms.id,
          code: schema.rooms.code,
          name: schema.rooms.name,
          createdAt: schema.rooms.createdAt,
          participantCount: sql<number>`count(${schema.participants.id})`,
        })
        .from(schema.rooms)
        .leftJoin(schema.participants, eq(schema.rooms.id, schema.participants.roomId))
        .groupBy(schema.rooms.id)
        .orderBy(desc(schema.rooms.createdAt))
        .all();

      return rows;
    },

    getAllRoomIds(): string[] {
      return db
        .select({ id: schema.rooms.id })
        .from(schema.rooms)
        .all()
        .map((r) => r.id);
    },

    deleteRoom(id: string): string[] | null {
      const room = db
        .select()
        .from(schema.rooms)
        .where(eq(schema.rooms.id, id))
        .get();

      if (!room) return null;

      const assetRows = db
        .select({ storagePath: schema.assets.storagePath })
        .from(schema.assets)
        .where(eq(schema.assets.roomId, id))
        .all();

      const assetPaths = assetRows.map((a) => a.storagePath);

      db.delete(schema.rooms).where(eq(schema.rooms.id, id)).run();

      return assetPaths;
    },
  };
}

export type RoomService = ReturnType<typeof createRoomService>;
