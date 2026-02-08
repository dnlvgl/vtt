import { useState } from "react";
import { Document, Page } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import "../../lib/pdfjs.js";
import { useUiStore } from "../../stores/uiStore.js";
import styles from "./PdfThumbnail.module.css";

interface PdfThumbnailProps {
  content: string | null;
  assetId: string | null;
}

export function PdfThumbnail({ content, assetId }: PdfThumbnailProps) {
  const openPdfViewer = useUiStore((s) => s.openPdfViewer);
  const [numPages, setNumPages] = useState<number | null>(null);

  if (!content) return null;

  const fileUrl = new URL(content, window.location.origin).toString();

  return (
    <div
      className={styles.pdfThumbnail}
      onDoubleClick={() => {
        if (assetId) openPdfViewer(assetId);
      }}
    >
      <Document
        file={fileUrl}
        onLoadSuccess={({ numPages: n }) => setNumPages(n)}
        onLoadError={(err) => console.error("PDF load error:", err)}
        loading={<div className={styles.loading}>Loading PDF...</div>}
        error={<div className={styles.error}>Failed to load PDF</div>}
      >
        <Page
          pageNumber={1}
          width={380}
          renderAnnotationLayer={false}
          renderTextLayer={false}
        />
      </Document>
      {numPages !== null && (
        <div className={styles.pageCount}>{numPages} page{numPages !== 1 ? "s" : ""}</div>
      )}
    </div>
  );
}
