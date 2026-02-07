import type { ChatMessage } from "./chat.js";
import type {
  ObjectCreatePayload,
  ObjectDeletePayload,
  ObjectUpdatePayload,
  ObjectVisibilityPayload,
  WhiteboardObject,
} from "./canvas.js";
import type { Participant } from "./room.js";

// Client -> Server messages
export type ClientMessage =
  | { type: "join_room"; payload: { sessionToken: string } }
  | { type: "object_create"; payload: ObjectCreatePayload }
  | { type: "object_update"; payload: ObjectUpdatePayload }
  | { type: "object_delete"; payload: ObjectDeletePayload }
  | { type: "object_reveal"; payload: ObjectVisibilityPayload }
  | { type: "object_hide"; payload: ObjectVisibilityPayload }
  | { type: "chat_message"; payload: { content: string } }
  | { type: "dice_roll"; payload: { formula: string } };

// Server -> Client messages
export type ServerMessage =
  | {
      type: "room_state";
      payload: {
        objects: WhiteboardObject[];
        messages: ChatMessage[];
        participants: Participant[];
      };
    }
  | { type: "participant_joined"; payload: Participant }
  | { type: "participant_left"; payload: { id: string } }
  | { type: "object_created"; payload: WhiteboardObject }
  | { type: "object_updated"; payload: WhiteboardObject }
  | { type: "object_deleted"; payload: { id: string } }
  | { type: "object_revealed"; payload: WhiteboardObject }
  | { type: "object_hidden"; payload: { id: string } }
  | { type: "chat_broadcast"; payload: ChatMessage }
  | { type: "error"; payload: { code: string; message: string } };
