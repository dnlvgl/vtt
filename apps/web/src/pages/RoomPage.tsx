import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import type { JoinRoomResponse, ServerMessage } from "@vtt/shared";
import { useRoomStore } from "../stores/roomStore.js";
import { useChatStore } from "../stores/chatStore.js";
import { useUiStore } from "../stores/uiStore.js";
import { connectWs, disconnectWs } from "../lib/ws.js";
import { Sidebar } from "../components/sidebar/Sidebar.js";
import styles from "./RoomPage.module.css";

export function RoomPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { room, sessionToken, setRoom, setParticipant, setGmSecret, setParticipants, addParticipant, removeParticipant } = useRoomStore();
  const { setMessages, addMessage } = useChatStore();
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const [loading, setLoading] = useState(!room);
  const [wsConnected, setWsConnected] = useState(false);

  // Rejoin room if we don't have state (page refresh)
  useEffect(() => {
    if (room) return;
    if (!code) {
      navigate("/");
      return;
    }

    const storedToken = localStorage.getItem(`session-${code}`);
    if (!storedToken) {
      navigate("/");
      return;
    }

    fetch(`/api/rooms/${code}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Reconnecting..." }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Room not found");
        const data: JoinRoomResponse = await res.json();
        setRoom(data.room);
        setParticipant(data.participant, data.sessionToken);
        localStorage.setItem(`session-${code}`, data.sessionToken);
      })
      .catch(() => navigate("/"))
      .finally(() => setLoading(false));
  }, [room, code, navigate, setRoom, setParticipant, setGmSecret]);

  // Connect WebSocket once we have room + token
  useEffect(() => {
    if (!room || !sessionToken || !code) return;

    function handleMessage(msg: ServerMessage) {
      switch (msg.type) {
        case "room_state":
          setParticipants(msg.payload.participants);
          setMessages(msg.payload.messages);
          setWsConnected(true);
          break;
        case "participant_joined":
          addParticipant(msg.payload);
          break;
        case "participant_left":
          removeParticipant(msg.payload.id);
          break;
        case "chat_broadcast":
          addMessage(msg.payload);
          break;
        case "error":
          console.error("WS error:", msg.payload.code, msg.payload.message);
          break;
      }
    }

    connectWs(code, sessionToken, handleMessage, () => {
      setWsConnected(false);
    });

    return () => {
      disconnectWs();
    };
  }, [room, sessionToken, code, setParticipants, setMessages, addParticipant, removeParticipant, addMessage]);

  if (loading) {
    return (
      <div className={styles.loading}>
        <p>Connecting to room...</p>
      </div>
    );
  }

  if (!room) return null;

  return (
    <div className={styles.layout}>
      <div className={styles.main}>
        <header className={styles.header}>
          <div className={styles.roomInfo}>
            <span className={styles.roomName}>{room.name}</span>
            <span className={styles.roomCode}>{room.code}</span>
            {!wsConnected && <span className={styles.connecting}>Connecting...</span>}
          </div>
          <div className={styles.headerActions}>
            <button
              className={styles.iconButton}
              onClick={() => navigator.clipboard.writeText(room.code)}
            >
              Copy Code
            </button>
            {!sidebarOpen && (
              <button className={styles.iconButton} onClick={toggleSidebar}>
                Chat
              </button>
            )}
          </div>
        </header>
        <div className={styles.canvasArea}>
          <div className={styles.placeholder}>
            Canvas will be here (Phase 4)
          </div>
        </div>
      </div>
      <Sidebar />
    </div>
  );
}
