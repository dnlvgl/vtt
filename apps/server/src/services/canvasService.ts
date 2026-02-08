import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import type { ObjectCreatePayload, ObjectUpdatePayload } from "@vtt/shared";
import type { Db } from "../db/index.js";
import { schema } from "../db/index.js";

export function createCanvasService(db: Db) {
  return {
    getObjects(roomId: string, includeHidden: boolean) {
      const objects = db
        .select()
        .from(schema.whiteboardObjects)
        .where(eq(schema.whiteboardObjects.roomId, roomId))
        .all();

      if (includeHidden) return objects;
      return objects.filter((o) => !o.hiddenFromPlayers);
    },

    getObject(id: string, roomId: string) {
      return db
        .select()
        .from(schema.whiteboardObjects)
        .where(
          and(
            eq(schema.whiteboardObjects.id, id),
            eq(schema.whiteboardObjects.roomId, roomId),
          ),
        )
        .get() ?? null;
    },

    createObject(roomId: string, createdBy: string, payload: ObjectCreatePayload) {
      const id = nanoid();
      const now = new Date().toISOString();

      const maxZ = db
        .select({ zIndex: schema.whiteboardObjects.zIndex })
        .from(schema.whiteboardObjects)
        .where(eq(schema.whiteboardObjects.roomId, roomId))
        .all()
        .reduce((max, o) => Math.max(max, o.zIndex), 0);

      const obj = {
        id,
        roomId,
        type: payload.type,
        x: payload.x,
        y: payload.y,
        width: payload.width,
        height: payload.height,
        zIndex: maxZ + 1,
        content: payload.content ?? null,
        assetId: payload.assetId ?? null,
        hiddenFromPlayers: payload.hiddenFromPlayers ?? false,
        style: payload.style ?? null,
        createdBy,
        createdAt: now,
        updatedAt: now,
      };

      db.insert(schema.whiteboardObjects).values(obj).run();
      return obj;
    },

    updateObject(id: string, roomId: string, payload: ObjectUpdatePayload) {
      const now = new Date().toISOString();

      const sets: Partial<typeof schema.whiteboardObjects.$inferInsert> = { updatedAt: now };
      if (payload.x !== undefined) sets.x = payload.x;
      if (payload.y !== undefined) sets.y = payload.y;
      if (payload.width !== undefined) sets.width = payload.width;
      if (payload.height !== undefined) sets.height = payload.height;
      if (payload.content !== undefined) sets.content = payload.content;
      if (payload.style !== undefined) sets.style = payload.style;
      if (payload.zIndex !== undefined) sets.zIndex = payload.zIndex;

      db.update(schema.whiteboardObjects)
        .set(sets)
        .where(
          and(
            eq(schema.whiteboardObjects.id, id),
            eq(schema.whiteboardObjects.roomId, roomId),
          ),
        )
        .run();

      return db
        .select()
        .from(schema.whiteboardObjects)
        .where(eq(schema.whiteboardObjects.id, id))
        .get();
    },

    deleteObject(id: string, roomId: string) {
      db.delete(schema.whiteboardObjects)
        .where(
          and(
            eq(schema.whiteboardObjects.id, id),
            eq(schema.whiteboardObjects.roomId, roomId),
          ),
        )
        .run();
    },

    setVisibility(id: string, roomId: string, hidden: boolean) {
      db.update(schema.whiteboardObjects)
        .set({ hiddenFromPlayers: hidden, updatedAt: new Date().toISOString() })
        .where(
          and(
            eq(schema.whiteboardObjects.id, id),
            eq(schema.whiteboardObjects.roomId, roomId),
          ),
        )
        .run();

      return db
        .select()
        .from(schema.whiteboardObjects)
        .where(eq(schema.whiteboardObjects.id, id))
        .get();
    },
  };
}

export type CanvasService = ReturnType<typeof createCanvasService>;
