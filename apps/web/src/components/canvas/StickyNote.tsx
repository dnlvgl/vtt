import { useCallback, useEffect, useRef, useState } from "react";
import { sendWs } from "../../lib/ws.js";
import styles from "./StickyNote.module.css";

interface StickyNoteProps {
  id: string;
  content: string;
  style: Record<string, string> | null;
  editing: boolean;
  onStartEdit: () => void;
}

export function StickyNote({ id, content, style, editing, onStartEdit }: StickyNoteProps) {
  const [text, setText] = useState(content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setText(content);
  }, [content]);

  useEffect(() => {
    if (editing) {
      textareaRef.current?.focus();
    }
  }, [editing]);

  const handleBlur = useCallback(() => {
    if (text !== content) {
      sendWs({
        type: "object_update",
        payload: { id, content: text },
      });
    }
  }, [id, text, content]);

  const bgColor = style?.backgroundColor ?? "#fef08a";

  if (editing) {
    return (
      <div
        className={`${styles.stickyNote} ${styles.editing}`}
        style={{ backgroundColor: bgColor }}
      >
        <textarea
          ref={textareaRef}
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

  return (
    <div
      className={styles.stickyNote}
      style={{ backgroundColor: bgColor }}
      onDoubleClick={onStartEdit}
    >
      <div className={styles.content}>
        {text || <span className={styles.placeholder}>Double-click to edit...</span>}
      </div>
    </div>
  );
}
