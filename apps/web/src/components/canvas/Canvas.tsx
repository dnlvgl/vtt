import { useCallback, useRef, useState } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { useCanvasStore } from "../../stores/canvasStore.js";
import { sendWs } from "../../lib/ws.js";
import { CanvasObject } from "./CanvasObject.js";
import styles from "./Canvas.module.css";

export function Canvas() {
  const objects = useCanvasStore((s) => s.objects);
  const selectedId = useCanvasStore((s) => s.selectedId);
  const setSelectedId = useCanvasStore((s) => s.setSelectedId);
  const [scale, setScale] = useState(1);
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleAddStickyNote = useCallback(() => {
    sendWs({
      type: "object_create",
      payload: {
        type: "sticky_note",
        x: 200 + Math.random() * 400,
        y: 200 + Math.random() * 400,
        width: 200,
        height: 200,
        content: "",
        style: { backgroundColor: "#fef08a" },
      },
    });
  }, []);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      setSelectedId(null);
    }
  }, [setSelectedId]);

  const objectIds = Object.keys(objects);

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <button className={styles.toolbarButton} onClick={handleAddStickyNote}>
          + Sticky Note
        </button>
      </div>

      <TransformWrapper
        initialScale={1}
        minScale={0.1}
        maxScale={3}
        limitToBounds={false}
        panning={{ velocityDisabled: true }}
        onTransformed={(_, state) => setScale(state.scale)}
      >
        <TransformComponent
          wrapperClass={styles.container}
          contentClass={styles.transformContent}
        >
          <div
            ref={canvasRef}
            className={styles.canvasContent}
            onClick={handleCanvasClick}
          >
            {objectIds.map((id) => (
              <CanvasObject
                key={id}
                id={id}
                scale={scale}
                isSelected={id === selectedId}
                onSelect={() => setSelectedId(id)}
              />
            ))}
          </div>
        </TransformComponent>
      </TransformWrapper>

      <div className={styles.zoomInfo}>{Math.round(scale * 100)}%</div>
    </div>
  );
}
