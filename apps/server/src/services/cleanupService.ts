import { unlinkSync } from "node:fs";
import type { RoomService } from "./roomService.js";
import type { WsManager } from "./wsManager.js";

const CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour
const IDLE_THRESHOLD = 24 * 60 * 60 * 1000; // 24 hours

export function startCleanupTimer(roomService: RoomService, wsManager: WsManager) {
  const timer = setInterval(() => {
    const roomIds = roomService.getAllRoomIds();
    const now = Date.now();

    for (const roomId of roomIds) {
      const connections = wsManager.getRoomConnections(roomId);
      if (connections.size > 0) continue;

      const participants = roomService.getParticipants(roomId);
      const allIdle = participants.every((p) => {
        const lastSeen = new Date(p.lastSeen).getTime();
        return now - lastSeen > IDLE_THRESHOLD;
      });

      if (!allIdle) continue;

      const assetPaths = roomService.deleteRoom(roomId);
      if (assetPaths) {
        for (const path of assetPaths) {
          try { unlinkSync(path); } catch { /* file may already be gone */ }
        }
      }
    }
  }, CLEANUP_INTERVAL);

  timer.unref();
  return timer;
}
