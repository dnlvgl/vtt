import { create } from "zustand";
import type { Room, Participant } from "@vtt/shared";

interface RoomState {
  room: Room | null;
  participant: Participant | null;
  sessionToken: string | null;
  gmSecret: string | null;
  participants: Participant[];
  isGm: boolean;

  setRoom: (room: Room) => void;
  setParticipant: (participant: Participant, sessionToken: string) => void;
  setGmSecret: (secret: string) => void;
  setParticipants: (participants: Participant[]) => void;
  addParticipant: (participant: Participant) => void;
  removeParticipant: (id: string) => void;
  reset: () => void;
}

export const useRoomStore = create<RoomState>((set) => ({
  room: null,
  participant: null,
  sessionToken: null,
  gmSecret: null,
  participants: [],
  isGm: false,

  setRoom: (room) => set({ room }),
  setParticipant: (participant, sessionToken) =>
    set({ participant, sessionToken, isGm: participant.isGm }),
  setGmSecret: (gmSecret) => set({ gmSecret }),
  setParticipants: (participants) => set({ participants }),
  addParticipant: (participant) =>
    set((s) => ({ participants: [...s.participants, participant] })),
  removeParticipant: (id) =>
    set((s) => ({
      participants: s.participants.filter((p) => p.id !== id),
    })),
  reset: () =>
    set({
      room: null,
      participant: null,
      sessionToken: null,
      gmSecret: null,
      participants: [],
      isGm: false,
    }),
}));
