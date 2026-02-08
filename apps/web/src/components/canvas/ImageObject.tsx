import styles from "./ImageObject.module.css";

interface ImageObjectProps {
  assetId: string | null;
  content: string | null;
}

export function ImageObject({ assetId, content }: ImageObjectProps) {
  const url = content;

  if (!url) return null;

  return (
    <div className={styles.imageObject}>
      <img
        className={styles.image}
        src={url}
        alt={assetId ?? "image"}
        draggable={false}
      />
    </div>
  );
}
