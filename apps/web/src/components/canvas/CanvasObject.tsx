import { useCallback, useRef } from "react";
import { Rnd } from "react-rnd";
import { useCanvasStore } from "../../stores/canvasStore.js";
import { sendWs } from "../../lib/ws.js";
import { StickyNote } from "./StickyNote.js";
import styles from "./CanvasObject.module.css";

interface CanvasObjectProps {
  id: string;
  scale: number;
  isSelected: boolean;
  onSelect: () => void;
}

export function CanvasObject({ id, scale, isSelected, onSelect }: CanvasObjectProps) {
  const object = useCanvasStore((s) => s.objects[id]);
  const updateObject = useCanvasStore((s) => s.updateObject);
  const rndRef = useRef<Rnd>(null);

  const handleDragStop = useCallback((_: unknown, d: { x: number; y: number }) => {
    const obj = useCanvasStore.getState().objects[id];
    if (!obj) return;
    updateObject({ ...obj, x: d.x, y: d.y });
    sendWs({
      type: "object_update",
      payload: { id, x: d.x, y: d.y },
    });
  }, [id, updateObject]);

  const handleResizeStop = useCallback(
    (_e: unknown, _dir: unknown, ref: HTMLElement, _delta: unknown, position: { x: number; y: number }) => {
      const obj = useCanvasStore.getState().objects[id];
      if (!obj) return;
      const width = parseInt(ref.style.width, 10);
      const height = parseInt(ref.style.height, 10);
      updateObject({ ...obj, x: position.x, y: position.y, width, height });
      sendWs({
        type: "object_update",
        payload: { id, x: position.x, y: position.y, width, height },
      });
    },
    [id, updateObject],
  );

  const handleDelete = useCallback(() => {
    sendWs({ type: "object_delete", payload: { id } });
  }, [id]);

  if (!object) return null;

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
    >
      <Rnd
        ref={rndRef}
        className={`${styles.object} ${isSelected ? styles.selected : ""}`}
        position={{ x: object.x, y: object.y }}
        size={{ width: object.width, height: object.height }}
        scale={scale}
        style={{ zIndex: object.zIndex }}
        onDragStart={onSelect}
        onDragStop={handleDragStop}
        onResizeStop={handleResizeStop}
        minWidth={100}
        minHeight={60}
      >
        {isSelected && (
          <button className={styles.deleteButton} onMouseDown={(e) => e.stopPropagation()} onClick={handleDelete}>
            &times;
          </button>
        )}
        {object.type === "sticky_note" && (
          <StickyNote id={id} content={object.content ?? ""} style={object.style} />
        )}
      </Rnd>
    </div>
  );
}
