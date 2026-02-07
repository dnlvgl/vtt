import type { WebSocket } from "ws";
import type { ServerMessage } from "@vtt/shared";

interface Connection {
  ws: WebSocket;
  participantId: string;
  roomId: string;
  isGm: boolean;
}

export function createWsManager() {
  const connections = new Map<WebSocket, Connection>();
  const rooms = new Map<string, Set<WebSocket>>();

  return {
    add(ws: WebSocket, participantId: string, roomId: string, isGm: boolean) {
      connections.set(ws, { ws, participantId, roomId, isGm });

      let room = rooms.get(roomId);
      if (!room) {
        room = new Set();
        rooms.set(roomId, room);
      }
      room.add(ws);
    },

    remove(ws: WebSocket) {
      const conn = connections.get(ws);
      if (!conn) return null;

      connections.delete(ws);
      const room = rooms.get(conn.roomId);
      if (room) {
        room.delete(ws);
        if (room.size === 0) rooms.delete(conn.roomId);
      }

      return conn;
    },

    get(ws: WebSocket) {
      return connections.get(ws) ?? null;
    },

    broadcast(roomId: string, message: ServerMessage, exclude?: WebSocket) {
      const room = rooms.get(roomId);
      if (!room) return;

      const data = JSON.stringify(message);
      for (const ws of room) {
        if (ws !== exclude && ws.readyState === ws.OPEN) {
          ws.send(data);
        }
      }
    },

    send(ws: WebSocket, message: ServerMessage) {
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify(message));
      }
    },

    getRoomConnections(roomId: string) {
      return rooms.get(roomId) ?? new Set<WebSocket>();
    },
  };
}

export type WsManager = ReturnType<typeof createWsManager>;
