import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { FastifyInstance } from "fastify";
import { nanoid } from "nanoid";
import { ALLOWED_IMAGE_TYPES, ALLOWED_PDF_TYPES, MAX_FILE_SIZE } from "@vtt/shared";
import type { RoomService } from "../services/roomService.js";
import type { AssetService } from "../services/assetService.js";

interface AssetDeps {
  roomService: RoomService;
  assetService: AssetService;
  uploadsDir: string;
}

export function assetRoutes(app: FastifyInstance, deps: AssetDeps) {
  const { roomService, assetService, uploadsDir } = deps;

  app.post<{ Params: { code: string } }>(
    "/api/rooms/:code/assets",
    async (request, reply) => {
      const token = request.headers["x-session-token"] as string | undefined;
      if (!token) {
        return reply.status(401).send({ error: "Session token required" });
      }

      const participant = roomService.getParticipantByToken(token);
      if (!participant) {
        return reply.status(401).send({ error: "Invalid session token" });
      }

      const room = roomService.getRoomByCode(request.params.code);
      if (!room || participant.roomId !== room.id) {
        return reply.status(404).send({ error: "Room not found" });
      }

      const file = await request.file();
      if (!file) {
        return reply.status(400).send({ error: "No file uploaded" });
      }

      const mimeType = file.mimetype;
      const allowedTypes: readonly string[] = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_PDF_TYPES];
      if (!allowedTypes.includes(mimeType)) {
        return reply.status(400).send({ error: `File type not allowed: ${mimeType}` });
      }

      const buffer = await file.toBuffer();
      if (buffer.length > MAX_FILE_SIZE) {
        return reply.status(400).send({ error: "File too large" });
      }

      // Save to disk: uploads/<roomId>/<assetId>.<ext>
      const roomDir = join(uploadsDir, room.id);
      if (!existsSync(roomDir)) {
        mkdirSync(roomDir, { recursive: true });
      }

      const assetId = nanoid();
      const ext = file.filename.includes(".")
        ? file.filename.substring(file.filename.lastIndexOf("."))
        : "";
      const storedFilename = `${assetId}${ext}`;
      const storagePath = join(roomDir, storedFilename);

      writeFileSync(storagePath, buffer);

      const asset = assetService.createAsset(
        assetId,
        room.id,
        participant.id,
        file.filename,
        mimeType,
        buffer.length,
        storagePath,
      );

      return reply.status(201).send({
        id: asset.id,
        filename: asset.filename,
        mimeType: asset.mimeType,
        sizeBytes: asset.sizeBytes,
        url: `/uploads/${room.id}/${storedFilename}`,
      });
    },
  );
}
