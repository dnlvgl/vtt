export type WhiteboardObjectType = "sticky_note" | "image" | "pdf";

export interface WhiteboardObject {
  id: string;
  roomId: string;
  type: WhiteboardObjectType;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  content: string | null;
  assetId: string | null;
  hiddenFromPlayers: boolean;
  style: Record<string, string> | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ObjectCreatePayload {
  type: WhiteboardObjectType;
  x: number;
  y: number;
  width: number;
  height: number;
  content?: string;
  assetId?: string;
  hiddenFromPlayers?: boolean;
  style?: Record<string, string>;
}

export interface ObjectUpdatePayload {
  id: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  content?: string;
  style?: Record<string, string>;
  zIndex?: number;
}

export interface ObjectDeletePayload {
  id: string;
}

export interface ObjectVisibilityPayload {
  id: string;
}
