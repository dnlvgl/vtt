import { useCallback, useState } from "react";
import { sendWs } from "../../lib/ws.js";
import styles from "./StickyNote.module.css";

interface StickyNoteProps {
  id: string;
  content: string;
  style: Record<string, string> | null;
}

export function StickyNote({ id, content, style }: StickyNoteProps) {
  const [text, setText] = useState(content);

  const handleBlur = useCallback(() => {
    if (text !== content) {
      sendWs({
        type: "object_update",
        payload: { id, content: text },
      });
    }
  }, [id, text, content]);

  return (
    <div
      className={styles.stickyNote}
      style={{ backgroundColor: style?.backgroundColor ?? "#fef08a" }}
    >
      <textarea
        className={styles.textarea}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={handleBlur}
        onMouseDown={(e) => e.stopPropagation()}
        placeholder="Type here..."
      />
    </div>
  );
}
