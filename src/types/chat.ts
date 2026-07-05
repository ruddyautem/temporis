import type { ReactNode } from "react";

export interface ChatMessage {
  id: string;
  sender: string;
  clearText: ReactNode;
  timestamp: number;
}