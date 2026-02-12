import * as ToastPrimitive from "@radix-ui/react-toast";
import { useToastStore } from "../../stores/toastStore.js";
import styles from "./Toast.module.css";

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  return (
    <>
      {toasts.map((toast) => (
        <ToastPrimitive.Root
          key={toast.id}
          className={`${styles.toast} ${styles[toast.type]}`}
          onOpenChange={(open) => {
            if (!open) removeToast(toast.id);
          }}
        >
          <ToastPrimitive.Description className={styles.message}>
            {toast.message}
          </ToastPrimitive.Description>
          <ToastPrimitive.Close className={styles.close}>
            &times;
          </ToastPrimitive.Close>
        </ToastPrimitive.Root>
      ))}
      <ToastPrimitive.Viewport className={styles.viewport} />
    </>
  );
}
