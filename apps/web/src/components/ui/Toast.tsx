import { useToastStore } from "../../stores/toastStore.js";
import styles from "./Toast.module.css";

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className={styles.container}>
      {toasts.map((toast) => (
        <div key={toast.id} className={`${styles.toast} ${styles[toast.type]}`}>
          <span className={styles.message}>{toast.message}</span>
          <button
            className={styles.close}
            onClick={() => removeToast(toast.id)}
          >
            &times;
          </button>
        </div>
      ))}
    </div>
  );
}
