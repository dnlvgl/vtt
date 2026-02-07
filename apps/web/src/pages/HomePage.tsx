import { useState } from "react";
import { useNavigate, Link } from "react-router";
import type { JoinRoomResponse } from "@vtt/shared";
import { useRoomStore } from "../stores/roomStore.js";
import styles from "./HomePage.module.css";

export function HomePage() {
  const navigate = useNavigate();
  const { setRoom, setParticipant } = useRoomStore();

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>VTT</h1>
      <p className={styles.subtitle}>Virtual Tabletop for Pen & Paper RPGs</p>
      <div className={styles.cards}>
        <JoinRoom
          onJoined={(data) => {
            setRoom(data.room);
            setParticipant(data.participant, data.sessionToken);
            localStorage.setItem(`session-${data.room.code}`, data.sessionToken);
            navigate(`/room/${data.room.code}`);
          }}
        />
        <div className={styles.card}>
          <h2>Game Master</h2>
          <p>Create and manage your game sessions.</p>
          <Link className={styles.button} to="/gm">
            Go to GM Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

function JoinRoom({ onJoined }: { onJoined: (data: JoinRoomResponse) => void }) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim() || !name.trim()) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/rooms/${code.toUpperCase().trim()}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (!res.ok) {
        if (res.status === 404) throw new Error("Room not found");
        throw new Error("Failed to join room");
      }
      const data: JoinRoomResponse = await res.json();
      onJoined(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join room.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className={styles.card} onSubmit={handleSubmit}>
      <h2>Join Room</h2>
      <p>Enter a room code to join an existing session.</p>
      <div className={styles.field}>
        <label htmlFor="join-code">Room Code</label>
        <input
          id="join-code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="e.g. ABC123"
          maxLength={6}
          required
        />
      </div>
      <div className={styles.field}>
        <label htmlFor="join-name">Your Name</label>
        <input
          id="join-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Gandalf"
          required
        />
      </div>
      <button className={styles.button} type="submit" disabled={loading}>
        {loading ? "Joining..." : "Join Room"}
      </button>
      {error && <p className={styles.error}>{error}</p>}
    </form>
  );
}
