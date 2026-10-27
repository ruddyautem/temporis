"use client";

import { RealtimeProvider } from "@upstash/realtime/client";
import type { ReactNode } from "react";

export default function RoomRealtimeProvider({ connectionId, children }: { connectionId: string; children: ReactNode }) {
  return <RealtimeProvider api={{ url: `/api/realtime/${connectionId}` }}>{children}</RealtimeProvider>;
}
