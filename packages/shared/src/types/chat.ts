export type ChatMessageType = "text" | "dice_roll";

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  type: ChatMessageType;
  content: string;
  diceFormula: string | null;
  diceResults: DiceResults | null;
  createdAt: string;
}

export interface DiceResults {
  formula: string;
  groups: DiceGroup[];
  modifier: number;
  total: number;
}

export interface DiceGroup {
  count: number;
  sides: number;
  rolls: number[];
  subtotal: number;
}
