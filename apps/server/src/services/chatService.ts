import { eq, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import { MAX_CHAT_HISTORY } from "@vtt/shared";
import type { DiceResults } from "@vtt/shared";
import type { Db } from "../db/index.js";
import { schema } from "../db/index.js";

export function createChatService(db: Db) {
  return {
    getMessages(roomId: string, limit: number = MAX_CHAT_HISTORY) {
      return db
        .select()
        .from(schema.chatMessages)
        .where(eq(schema.chatMessages.roomId, roomId))
        .orderBy(desc(schema.chatMessages.createdAt))
        .limit(limit)
        .all()
        .reverse();
    },

    addMessage(
      roomId: string,
      senderId: string,
      senderName: string,
      content: string,
      type: "text" | "dice_roll" = "text",
      diceFormula?: string,
      diceResults?: DiceResults,
    ) {
      const id = nanoid();
      const now = new Date().toISOString();

      const msg = {
        id,
        roomId,
        senderId,
        senderName,
        type,
        content,
        diceFormula: diceFormula ?? null,
        diceResults: diceResults ?? null,
        createdAt: now,
      };

      db.insert(schema.chatMessages).values(msg).run();
      return msg;
    },
  };
}

export type ChatService = ReturnType<typeof createChatService>;
