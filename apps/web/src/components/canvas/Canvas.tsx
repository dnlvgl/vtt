import { useCallback, useRef, useState } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import * as Toolbar from "@radix-ui/react-toolbar";
import { ALLOWED_IMAGE_TYPES, ALLOWED_PDF_TYPES } from "@vtt/shared";
import type { WhiteboardObjectType } from "@vtt/shared";
import { useCanvasStore } from "../../stores/canvasStore.js";
import { useRoomStore } from "../../stores/roomStore.js";
import { sendWs } from "../../lib/ws.js";
import { useToastStore } from "../../stores/toastStore.js";
import { CanvasObject } from "./CanvasObject.js";
import { Tooltip } from "../ui/Tooltip.js";
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
  const [uploading, setUploading] = useState(false);
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

    setUploading(true);
    try {
      const res = await fetch(`/api/rooms/${room.code}/assets`, {
        method: "POST",
        headers: { "x-session-token": sessionToken },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        useToastStore.getState().addToast("error", err.error ?? "Upload failed");
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
    } catch {
      useToastStore.getState().addToast("error", "Upload failed. Please try again.");
    } finally {
      setUploading(false);
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
      <Toolbar.Root className={styles.toolbar}>
        <Toolbar.Button className={styles.toolbarButton} onClick={handleAddStickyNote}>
          + Sticky Note
        </Toolbar.Button>
        <Toolbar.Button className={styles.toolbarButton} onClick={() => imageInputRef.current?.click()} disabled={uploading}>
          + Image
        </Toolbar.Button>
        <Toolbar.Button className={styles.toolbarButton} onClick={() => pdfInputRef.current?.click()} disabled={uploading}>
          + PDF
        </Toolbar.Button>
        {uploading && <span className={styles.uploadingIndicator}>Uploading...</span>}
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
            <Toolbar.Separator className={styles.toolbarSeparator} />
            <Tooltip content="New objects will be created hidden from players">
              <Toolbar.Button
                className={`${styles.toolbarToggle} ${createHidden ? styles.toolbarToggleActive : ""}`}
                onClick={() => setCreateHidden((v) => !v)}
              >
                Create as: {createHidden ? "Hidden" : "Visible"}
              </Toolbar.Button>
            </Tooltip>
          </>
        )}
      </Toolbar.Root>

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
