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
      const updates: Record<string, unknown> = { updatedAt: now };

      if (payload.x !== undefined) updates["x"] = payload.x;
      if (payload.y !== undefined) updates["y"] = payload.y;
      if (payload.width !== undefined) updates["width"] = payload.width;
      if (payload.height !== undefined) updates["height"] = payload.height;
      if (payload.content !== undefined) updates["content"] = payload.content;
      if (payload.style !== undefined) updates["style"] = payload.style;
      if (payload.zIndex !== undefined) updates["zIndex"] = payload.zIndex;

      db.update(schema.whiteboardObjects)
        .set(updates)
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
