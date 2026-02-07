import { z } from "zod";

export const CreateRoomSchema = z.object({
  name: z.string().min(1).max(100),
});

export const JoinRoomSchema = z.object({
  name: z.string().min(1).max(50),
  gmSecret: z.string().optional(),
});

export type CreateRoomRequest = z.infer<typeof CreateRoomSchema>;
export type JoinRoomRequest = z.infer<typeof JoinRoomSchema>;

export interface Room {
  id: string;
  code: string;
  name: string;
  createdAt: string;
}

export interface Participant {
  id: string;
  roomId: string;
  name: string;
  isGm: boolean;
  lastSeen: string;
}

export interface RoomSummary {
  id: string;
  code: string;
  name: string;
  createdAt: string;
  participantCount: number;
}

export interface CreateRoomResponse {
  room: Room;
  gmSecret: string;
  sessionToken: string;
  participant: Participant;
}

export interface JoinRoomResponse {
  room: Room;
  sessionToken: string;
  participant: Participant;
}
