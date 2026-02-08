import { eq } from "drizzle-orm";
import type { Db } from "../db/index.js";
import { schema } from "../db/index.js";

export function createAssetService(db: Db) {
  return {
    createAsset(
      id: string,
      roomId: string,
      uploadedBy: string,
      filename: string,
      mimeType: string,
      sizeBytes: number,
      storagePath: string,
    ) {
      const now = new Date().toISOString();

      const asset = {
        id,
        roomId,
        filename,
        storagePath,
        mimeType,
        sizeBytes,
        uploadedBy,
        createdAt: now,
      };

      db.insert(schema.assets).values(asset).run();
      return asset;
    },

    getAsset(id: string) {
      return db
        .select()
        .from(schema.assets)
        .where(eq(schema.assets.id, id))
        .get();
    },
  };
}

export type AssetService = ReturnType<typeof createAssetService>;
