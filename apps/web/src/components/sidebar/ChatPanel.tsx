import { useEffect, useRef, useState } from "react";
import type { ChatMessage } from "@vtt/shared";
import { useChatStore } from "../../stores/chatStore.js";
import { sendWs } from "../../lib/ws.js";
import styles from "./ChatPanel.module.css";

const DICE_COMMAND = /^\/(?:dice|roll|r)\s+(.+)/i;

export function ChatPanel() {
  const messages = useChatStore((s) => s.messages);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;

    const diceMatch = text.match(DICE_COMMAND);
    if (diceMatch) {
      sendWs({ type: "dice_roll", payload: { formula: diceMatch[1]! } });
    } else {
      sendWs({ type: "chat_message", payload: { content: text } });
    }

    setInput("");
  }

  return (
    <div className={styles.container}>
      {messages.length === 0 ? (
        <div className={styles.emptyState}>No messages yet</div>
      ) : (
        <div className={styles.messages}>
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      )}
      <form className={styles.inputArea} onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Message or /roll 2d6+3"
        />
        <button className={styles.sendButton} type="submit">
          Send
        </button>
      </form>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  if (message.type === "dice_roll" && message.diceResults) {
    const r = message.diceResults;
    const rollDetails = r.groups
      .map((g) => `${g.count}d${g.sides}: [${g.rolls.join(", ")}]`)
      .join(" + ");

    return (
      <div className={`${styles.message} ${styles.diceMessage}`}>
        <span className={styles.senderName}>{message.senderName}</span>
        <div className={styles.diceFormula}>{r.formula}</div>
        <div className={styles.diceRolls}>{rollDetails}{r.modifier !== 0 ? ` ${r.modifier > 0 ? "+" : ""}${r.modifier}` : ""}</div>
        <div className={styles.diceTotal}>{r.total}</div>
      </div>
    );
  }

  return (
    <div className={styles.message}>
      <span className={styles.senderName}>{message.senderName}</span>
      <span className={styles.messageContent}>{message.content}</span>
    </div>
  );
}
