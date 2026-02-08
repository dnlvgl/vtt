import { useCallback, useEffect, useRef, useState } from "react";
import { Document, Page } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import "../../lib/pdfjs.js";
import { useCanvasStore } from "../../stores/canvasStore.js";
import { useUiStore } from "../../stores/uiStore.js";
import styles from "./PdfViewer.module.css";

export function PdfViewer() {
  const pdfAssetId = useUiStore((s) => s.pdfAssetId);
  const closePdfViewer = useUiStore((s) => s.closePdfViewer);
  const objects = useCanvasStore((s) => s.objects);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pageWidth, setPageWidth] = useState(600);

  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);

  // Size the page to fit the container width
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width) setPageWidth(width - 32); // subtract padding
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closePdfViewer();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closePdfViewer]);

  const pdfObject = Object.values(objects).find(
    (o) => o.type === "pdf" && o.assetId === pdfAssetId,
  );
  const content = pdfObject?.content;

  const handlePrev = useCallback(() => setPageNumber((p) => Math.max(1, p - 1)), []);
  const handleNext = useCallback(() => setPageNumber((p) => Math.min(numPages ?? p, p + 1)), [numPages]);

  if (!content) return null;

  const fileUrl = new URL(content, window.location.origin).toString();

  return (
    <div className={styles.overlay}>
      <div className={styles.panel}>
        <div className={styles.toolbar}>
          <span className={styles.filename}>{pdfObject?.content?.split("/").pop() ?? "PDF"}</span>
          <div className={styles.nav}>
            <button
              className={styles.navButton}
              disabled={pageNumber <= 1}
              onClick={handlePrev}
            >
              Prev
            </button>
            <span className={styles.pageInfo}>
              {pageNumber} / {numPages ?? "..."}
            </span>
            <button
              className={styles.navButton}
              disabled={numPages === null || pageNumber >= numPages}
              onClick={handleNext}
            >
              Next
            </button>
          </div>
          <button className={styles.closeButton} onClick={closePdfViewer}>
            &times;
          </button>
        </div>
        <div ref={containerRef} className={styles.pageContainer}>
          <Document
            file={fileUrl}
            onLoadSuccess={({ numPages: n }) => {
              setNumPages(n);
              setPageNumber(1);
            }}
            onLoadError={(err) => console.error("PDF load error:", err)}
            loading={<div className={styles.loading}>Loading PDF...</div>}
            error={<div className={styles.loading}>Failed to load PDF</div>}
          >
            <Page
              pageNumber={pageNumber}
              width={pageWidth}
              renderAnnotationLayer={true}
              renderTextLayer={true}
            />
          </Document>
        </div>
      </div>
    </div>
  );
}
