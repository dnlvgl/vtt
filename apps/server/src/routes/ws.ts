import { randomInt } from "node:crypto";
import type { FastifyInstance } from "fastify";
import type { ClientMessage, ChatMessage } from "@vtt/shared";
import { rollDice } from "@vtt/shared";

function cryptoRandom(max: number): number {
  return randomInt(1, max + 1);
}
import type { RoomService } from "../services/roomService.js";
import type { CanvasService } from "../services/canvasService.js";
import type { ChatService } from "../services/chatService.js";
import type { WsManager } from "../services/wsManager.js";

interface WsDeps {
  roomService: RoomService;
  canvasService: CanvasService;
  chatService: ChatService;
  wsManager: WsManager;
}

export function wsRoutes(app: FastifyInstance, deps: WsDeps) {
  const { roomService, canvasService, chatService, wsManager } = deps;

  app.get<{ Params: { code: string }; Querystring: { token?: string } }>(
    "/ws/:code",
    { websocket: true },
    (socket, request) => {
      const { code } = request.params;
      const token = request.query.token;

      if (!token) {
        wsManager.send(socket, {
          type: "error",
          payload: { code: "AUTH_REQUIRED", message: "Session token required" },
        });
        socket.close();
        return;
      }

      const participant = roomService.getParticipantByToken(token);
      if (!participant) {
        wsManager.send(socket, {
          type: "error",
          payload: { code: "INVALID_TOKEN", message: "Invalid session token" },
        });
        socket.close();
        return;
      }

      const room = roomService.getRoomByCode(code);
      if (!room || participant.roomId !== room.id) {
        wsManager.send(socket, {
          type: "error",
          payload: { code: "ROOM_MISMATCH", message: "Token does not match room" },
        });
        socket.close();
        return;
      }

      // Register connection
      wsManager.add(socket, participant.id, room.id, participant.isGm);
      roomService.updateLastSeen(participant.id);

      // Send room state
      const objects = canvasService.getObjects(room.id, participant.isGm);
      const messages = chatService.getMessages(room.id) as ChatMessage[];
      const participants = roomService.getParticipants(room.id);

      wsManager.send(socket, {
        type: "room_state",
        payload: { objects, messages, participants },
      });

      // Broadcast join to others
      wsManager.broadcast(room.id, {
        type: "participant_joined",
        payload: {
          id: participant.id,
          roomId: room.id,
          name: participant.name,
          isGm: participant.isGm,
          lastSeen: participant.lastSeen,
        },
      }, socket);

      // Handle messages
      socket.on("message", (raw) => {
        let msg: ClientMessage;
        try {
          msg = JSON.parse(String(raw));
        } catch {
          return;
        }

        handleMessage(socket, msg, room.id, participant.id, participant.name, participant.isGm);
      });

      socket.on("close", () => {
        const conn = wsManager.remove(socket);
        if (conn) {
          wsManager.broadcast(conn.roomId, {
            type: "participant_left",
            payload: { id: conn.participantId },
          });
        }
      });
    },
  );

  function handleMessage(
    socket: import("ws").WebSocket,
    msg: ClientMessage,
    roomId: string,
    participantId: string,
    participantName: string,
    isGm: boolean,
  ) {
    switch (msg.type) {
      case "chat_message": {
        const content = msg.payload.content.trim();
        if (!content) return;

        const chatMsg = chatService.addMessage(
          roomId,
          participantId,
          participantName,
          content,
        );

        wsManager.broadcast(roomId, {
          type: "chat_broadcast",
          payload: chatMsg,
        });
        break;
      }

      case "dice_roll": {
        const formula = msg.payload.formula.trim();
        if (!formula) return;

        const result = rollDice(formula, cryptoRandom);
        if (!result) {
          wsManager.send(socket, {
            type: "error",
            payload: { code: "INVALID_DICE", message: `Invalid dice formula: ${formula}` },
          });
          return;
        }

        const chatMsg = chatService.addMessage(
          roomId,
          participantId,
          participantName,
          `rolled ${formula}`,
          "dice_roll",
          formula,
          result,
        );

        wsManager.broadcast(roomId, {
          type: "chat_broadcast",
          payload: chatMsg,
        });
        break;
      }

      case "object_create": {
        const obj = canvasService.createObject(roomId, participantId, msg.payload);
        if (obj.hiddenFromPlayers && !isGm) return;

        // Send to creator
        wsManager.send(socket, { type: "object_created", payload: obj });

        // Broadcast to others (filter hidden for non-GMs)
        if (obj.hiddenFromPlayers) {
          // Only broadcast to GMs
          for (const ws of wsManager.getRoomConnections(roomId)) {
            const conn = wsManager.get(ws);
            if (ws !== socket && conn?.isGm) {
              wsManager.send(ws, { type: "object_created", payload: obj });
            }
          }
        } else {
          wsManager.broadcast(roomId, { type: "object_created", payload: obj }, socket);
        }
        break;
      }

      case "object_update": {
        const updated = canvasService.updateObject(msg.payload.id, roomId, msg.payload);
        if (!updated) return;

        wsManager.broadcast(roomId, { type: "object_updated", payload: updated }, socket);
        break;
      }

      case "object_delete": {
        canvasService.deleteObject(msg.payload.id, roomId);
        wsManager.broadcast(roomId, { type: "object_deleted", payload: { id: msg.payload.id } }, socket);
        break;
      }

      case "object_reveal": {
        if (!isGm) return;
        const revealed = canvasService.setVisibility(msg.payload.id, roomId, false);
        if (!revealed) return;

        wsManager.broadcast(roomId, { type: "object_revealed", payload: revealed });
        break;
      }

      case "object_hide": {
        if (!isGm) return;
        const hidden = canvasService.setVisibility(msg.payload.id, roomId, true);
        if (!hidden) return;

        wsManager.broadcast(roomId, { type: "object_hidden", payload: { id: hidden.id } });
        break;
      }

      case "join_room":
        // Already handled at connection time
        break;
    }
  }
}
