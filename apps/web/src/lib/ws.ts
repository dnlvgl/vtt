import type { ClientMessage, ServerMessage } from "@vtt/shared";
import { useToastStore } from "../stores/toastStore.js";

type MessageHandler = (message: ServerMessage) => void;
type StatusChangeHandler = (connected: boolean) => void;

let socket: WebSocket | null = null;
let messageHandler: MessageHandler | null = null;
let statusChangeHandler: StatusChangeHandler | null = null;
let intentionalClose = false;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let attempt = 0;
let storedCode: string | null = null;
let storedToken: string | null = null;
let hasToastedDisconnect = false;

const MAX_ATTEMPTS = 20;

function getDelay(n: number): number {
  const base = Math.min(1000 * Math.pow(2, n), 30000);
  const jitter = Math.random() * 1000;
  return base + jitter;
}

function doConnect(): void {
  if (!storedCode || !storedToken || !messageHandler) return;

  const protocol = location.protocol === "https:" ? "wss:" : "ws:";
  const url = `${protocol}//${location.host}/ws/${storedCode}?token=${encodeURIComponent(storedToken)}`;

  const ws = new WebSocket(url);
  socket = ws;

  ws.addEventListener("open", () => {
    attempt = 0;
    hasToastedDisconnect = false;
    statusChangeHandler?.(true);
  });

  ws.addEventListener("message", (event) => {
    try {
      const msg: ServerMessage = JSON.parse(event.data);
      messageHandler?.(msg);
    } catch {
      // Ignore malformed messages
    }
  });

  ws.addEventListener("close", () => {
    // Only process if this is still the active socket (avoids StrictMode race)
    if (socket !== ws) return;
    socket = null;
    statusChangeHandler?.(false);

    if (intentionalClose) return;

    if (!hasToastedDisconnect) {
      hasToastedDisconnect = true;
      useToastStore.getState().addToast("warning", "Connection lost. Reconnecting...");
    }

    if (attempt < MAX_ATTEMPTS) {
      const delay = getDelay(attempt);
      attempt++;
      reconnectTimer = setTimeout(doConnect, delay);
    } else {
      useToastStore.getState().addToast("error", "Could not reconnect. Please refresh.");
    }
  });
}

export function connectWs(
  code: string,
  token: string,
  onMessage: MessageHandler,
  onStatusChange: StatusChangeHandler,
): void {
  disconnectWs();

  storedCode = code;
  storedToken = token;
  messageHandler = onMessage;
  statusChangeHandler = onStatusChange;
  intentionalClose = false;
  attempt = 0;
  hasToastedDisconnect = false;

  doConnect();
}

export function disconnectWs(): void {
  intentionalClose = true;
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (socket) {
    messageHandler = null;
    statusChangeHandler = null;
    socket.close();
    socket = null;
  }
  storedCode = null;
  storedToken = null;
}

export function sendWs(message: ClientMessage): void {
  if (socket?.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message));
  }
}
