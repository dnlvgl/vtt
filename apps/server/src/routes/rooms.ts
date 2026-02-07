import { unlinkSync } from "node:fs";
import type { FastifyInstance } from "fastify";
import { CreateRoomSchema, JoinRoomSchema } from "@vtt/shared";
import type { RoomService } from "../services/roomService.js";

export function roomRoutes(
  app: FastifyInstance,
  roomService: RoomService,
) {
  app.get("/api/rooms", async () => {
    const rooms = roomService.listRooms();
    return { rooms };
  });

  app.post("/api/rooms", async (request, reply) => {
    const parsed = CreateRoomSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }

    const result = roomService.createRoom(parsed.data.name);
    return reply.status(201).send(result);
  });

  app.delete<{ Params: { id: string } }>(
    "/api/rooms/:id",
    async (request, reply) => {
      const assetPaths = roomService.deleteRoom(request.params.id);

      if (assetPaths === null) {
        return reply.status(404).send({ error: "Room not found" });
      }

      for (const filePath of assetPaths) {
        try {
          unlinkSync(filePath);
        } catch {
          // File may already be gone
        }
      }

      return { success: true };
    },
  );

  app.post<{ Params: { code: string } }>(
    "/api/rooms/:code/join",
    async (request, reply) => {
      const parsed = JoinRoomSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.flatten() });
      }

      const result = roomService.joinRoom(
        request.params.code,
        parsed.data.name,
        parsed.data.gmSecret,
      );

      if (!result) {
        return reply.status(404).send({ error: "Room not found" });
      }

      return reply.status(200).send(result);
    },
  );
}
