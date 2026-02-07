import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import type { JoinRoomResponse } from "@vtt/shared";
import { useRoomStore } from "../stores/roomStore.js";
import styles from "./RoomPage.module.css";

export function RoomPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { room, setRoom, setParticipant, setGmSecret } = useRoomStore();
  const [loading, setLoading] = useState(!room);

  useEffect(() => {
    if (room) return;
    if (!code) {
      navigate("/");
      return;
    }

    // Try to rejoin with stored session token
    const sessionToken = localStorage.getItem(`session-${code}`);
    if (!sessionToken) {
      navigate("/");
      return;
    }

    // Re-join the room
    const gmSecret = localStorage.getItem(`gm-secret-${code}`);
    fetch(`/api/rooms/${code}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Reconnecting...",
        ...(gmSecret ? { gmSecret } : {}),
      }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Room not found");
        const data: JoinRoomResponse = await res.json();
        setRoom(data.room);
        setParticipant(data.participant, data.sessionToken);
        if (gmSecret) setGmSecret(gmSecret);
        localStorage.setItem(`session-${code}`, data.sessionToken);
      })
      .catch(() => navigate("/"))
      .finally(() => setLoading(false));
  }, [room, code, navigate, setRoom, setParticipant, setGmSecret]);

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
          </div>
          <div className={styles.headerActions}>
            <button
              className={styles.iconButton}
              onClick={() => navigator.clipboard.writeText(room.code)}
            >
              Copy Code
            </button>
          </div>
        </header>
        <div className={styles.canvasArea}>
          <div className={styles.placeholder}>
            Canvas will be here (Phase 4)
          </div>
        </div>
      </div>
    </div>
  );
}
