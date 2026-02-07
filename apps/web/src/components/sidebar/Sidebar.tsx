import { useUiStore } from "../../stores/uiStore.js";
import { ChatPanel } from "./ChatPanel.js";
import styles from "./Sidebar.module.css";

export function Sidebar() {
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);

  if (!sidebarOpen) return null;

  return (
    <div className={styles.sidebar}>
      <div className={styles.header}>
        <span className={styles.headerTitle}>Chat</span>
        <button className={styles.closeButton} onClick={toggleSidebar}>
          &times;
        </button>
      </div>
      <div className={styles.content}>
        <ChatPanel />
      </div>
    </div>
  );
}
