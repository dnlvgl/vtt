import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router";
import type { RoomSummary, CreateRoomResponse, JoinRoomResponse } from "@vtt/shared";
import { useRoomStore } from "../stores/roomStore.js";
import styles from "./GmDashboardPage.module.css";

export function GmDashboardPage() {
  const navigate = useNavigate();
  const { setRoom, setParticipant } = useRoomStore();
  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [newRoomName, setNewRoomName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchRooms();
  }, []);

  async function fetchRooms() {
    try {
      const res = await fetch("/api/rooms");
      if (!res.ok) throw new Error("Failed to fetch rooms");
      const data: { rooms: RoomSummary[] } = await res.json();
      setRooms(data.rooms);
    } catch {
      setError("Failed to load rooms.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newRoomName.trim()) return;
    setCreating(true);
    setError("");

    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newRoomName.trim() }),
      });
      if (!res.ok) throw new Error("Failed to create room");
      const data: CreateRoomResponse = await res.json();
      setRooms((prev) => [
        {
          id: data.room.id,
          code: data.room.code,
          name: data.room.name,
          createdAt: data.room.createdAt,
          participantCount: 1,
        },
        ...prev,
      ]);
      setNewRoomName("");
    } catch {
      setError("Failed to create room.");
    } finally {
      setCreating(false);
    }
  }

  async function handleEnter(room: RoomSummary) {
    setError("");
    try {
      const res = await fetch(`/api/rooms/${room.code}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Game Master" }),
      });
      if (!res.ok) throw new Error("Failed to enter room");
      const data: JoinRoomResponse = await res.json();
      setRoom(data.room);
      setParticipant(data.participant, data.sessionToken);
      localStorage.setItem(`session-${data.room.code}`, data.sessionToken);
      navigate(`/room/${data.room.code}`);
    } catch {
      setError("Failed to enter room.");
    }
  }

  async function handleDelete(room: RoomSummary) {
    if (!window.confirm(`Delete room "${room.name}"? This cannot be undone.`)) return;
    setError("");

    try {
      const res = await fetch(`/api/rooms/${room.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete room");
      setRooms((prev) => prev.filter((r) => r.id !== room.id));
    } catch {
      setError("Failed to delete room.");
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link className={styles.backLink} to="/">
          &larr; Back to Home
        </Link>
        <h1 className={styles.title}>GM Dashboard</h1>
      </div>

      <form className={styles.createForm} onSubmit={handleCreate}>
        <input
          value={newRoomName}
          onChange={(e) => setNewRoomName(e.target.value)}
          placeholder="New room name..."
          required
        />
        <button className={styles.createButton} type="submit" disabled={creating}>
          {creating ? "Creating..." : "Create Room"}
        </button>
      </form>

      {error && <p className={styles.error}>{error}</p>}

      {loading ? (
        <p className={styles.emptyState}>Loading...</p>
      ) : rooms.length === 0 ? (
        <p className={styles.emptyState}>No rooms yet. Create one above.</p>
      ) : (
        <div className={styles.roomList}>
          {rooms.map((room) => (
            <div key={room.id} className={styles.roomRow}>
              <div className={styles.roomInfo}>
                <div className={styles.roomName}>{room.name}</div>
                <div className={styles.roomMeta}>
                  <span className={styles.roomCode}>{room.code}</span>
                  <span>{room.participantCount} participant{room.participantCount !== 1 ? "s" : ""}</span>
                  <span>{new Date(room.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <div className={styles.roomActions}>
                <button
                  className={styles.enterButton}
                  onClick={() => handleEnter(room)}
                >
                  Enter
                </button>
                <button
                  className={styles.deleteButton}
                  onClick={() => handleDelete(room)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
