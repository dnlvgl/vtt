import type { ClientMessage, ServerMessage } from "@vtt/shared";

type MessageHandler = (message: ServerMessage) => void;

let socket: WebSocket | null = null;
let messageHandler: MessageHandler | null = null;

export function connectWs(
  code: string,
  token: string,
  onMessage: MessageHandler,
  onClose?: () => void,
): void {
  disconnectWs();

  const protocol = location.protocol === "https:" ? "wss:" : "ws:";
  const url = `${protocol}//${location.host}/ws/${code}?token=${encodeURIComponent(token)}`;

  messageHandler = onMessage;
  const ws = new WebSocket(url);
  socket = ws;

  ws.addEventListener("message", (event) => {
    try {
      const msg: ServerMessage = JSON.parse(event.data);
      messageHandler?.(msg);
    } catch {
      // Ignore malformed messages
    }
  });

  ws.addEventListener("close", () => {
    // Only clear if this is still the active socket (avoids StrictMode race)
    if (socket === ws) {
      socket = null;
    }
    onClose?.();
  });
}

export function disconnectWs(): void {
  if (socket) {
    messageHandler = null;
    socket.close();
    socket = null;
  }
}

export function sendWs(message: ClientMessage): void {
  if (socket?.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message));
  }
}
