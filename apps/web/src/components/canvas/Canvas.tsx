import { useCallback, useRef, useState } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { ALLOWED_IMAGE_TYPES, ALLOWED_PDF_TYPES } from "@vtt/shared";
import type { WhiteboardObjectType } from "@vtt/shared";
import { useCanvasStore } from "../../stores/canvasStore.js";
import { useRoomStore } from "../../stores/roomStore.js";
import { sendWs } from "../../lib/ws.js";
import { CanvasObject } from "./CanvasObject.js";
import styles from "./Canvas.module.css";

export function Canvas() {
  const objects = useCanvasStore((s) => s.objects);
  const selectedId = useCanvasStore((s) => s.selectedId);
  const setSelectedId = useCanvasStore((s) => s.setSelectedId);
  const room = useRoomStore((s) => s.room);
  const sessionToken = useRoomStore((s) => s.sessionToken);
  const isGm = useRoomStore((s) => s.isGm);
  const [scale, setScale] = useState(1);
  const [createHidden, setCreateHidden] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

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
        ...(createHidden ? { hiddenFromPlayers: true } : {}),
      },
    });
  }, [createHidden]);

  const uploadAsset = useCallback(async (
    file: File,
    objectType: WhiteboardObjectType,
    width: number,
    height: number,
  ) => {
    if (!room || !sessionToken) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`/api/rooms/${room.code}/assets`, {
        method: "POST",
        headers: { "x-session-token": sessionToken },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        console.error("Upload failed:", err.error);
        return;
      }

      const asset: { id: string; url: string } = await res.json();

      sendWs({
        type: "object_create",
        payload: {
          type: objectType,
          x: 200 + Math.random() * 400,
          y: 200 + Math.random() * 400,
          width,
          height,
          content: asset.url,
          assetId: asset.id,
          ...(createHidden ? { hiddenFromPlayers: true } : {}),
        },
      });
    } catch (err) {
      console.error("Upload failed:", err);
    }
  }, [room, sessionToken, createHidden]);

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await uploadAsset(file, "image", 400, 300);
    e.target.value = "";
  }, [uploadAsset]);

  const handlePdfUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await uploadAsset(file, "pdf", 400, 500);
    e.target.value = "";
  }, [uploadAsset]);

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
        <button className={styles.toolbarButton} onClick={() => imageInputRef.current?.click()}>
          + Image
        </button>
        <button className={styles.toolbarButton} onClick={() => pdfInputRef.current?.click()}>
          + PDF
        </button>
        <input
          ref={imageInputRef}
          type="file"
          accept={ALLOWED_IMAGE_TYPES.join(",")}
          onChange={handleImageUpload}
          hidden
        />
        <input
          ref={pdfInputRef}
          type="file"
          accept={ALLOWED_PDF_TYPES.join(",")}
          onChange={handlePdfUpload}
          hidden
        />
        {isGm && (
          <>
            <div className={styles.toolbarSeparator} />
            <button
              className={`${styles.toolbarToggle} ${createHidden ? styles.toolbarToggleActive : ""}`}
              onClick={() => setCreateHidden((v) => !v)}
              title="New objects will be created hidden from players"
            >
              Create as: {createHidden ? "Hidden" : "Visible"}
            </button>
          </>
        )}
      </div>

      <TransformWrapper
        initialScale={1}
        minScale={0.1}
        maxScale={3}
        limitToBounds={false}
        panning={{ velocityDisabled: true }}
        doubleClick={{ disabled: true }}
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
