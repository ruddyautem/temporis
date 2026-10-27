import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { RoomConnection } from "@/lib/client";
import { PRESENCE_HEARTBEAT_MS } from "@/lib/room-presence-config";
import type { RoomExitReason } from "./use-room-session";
import type { MutableRefObject } from "react";

/**
 * Polls the room's remaining TTL and ticks it down locally between polls,
 * so the countdown stays smooth without hammering the API every second.
 * Calls onExpire once when the timer hits zero.
 */
export const useRoomCountdown = (
  roomId: string,
  connection: RoomConnection,
  isConnected: boolean,
  onExpire: (reason: RoomExitReason) => void,
  otherUsersCountRef?: MutableRefObject<number>,
) => {
  const client = connection.api;
  const storageKey = `temporis_ttl_${roomId}`;

  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const cached = sessionStorage.getItem(storageKey);
      if (cached) {
        const { ttl, timestamp } = JSON.parse(cached);
        const elapsed = Math.floor((Date.now() - timestamp) / 1000);
        return Math.max(0, ttl - elapsed);
      }
    } catch {
      // Ignore sessionStorage read errors
    }
    return null;
  });

  const [initialSeconds, setInitialSeconds] = useState<number | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const cached = sessionStorage.getItem(`${storageKey}_initial`);
      if (cached) return parseInt(cached, 10);
    } catch {
      // Ignore
    }
    return null;
  });

  const lastSyncedValue = useRef<number | undefined>(undefined);

  const { data: ttlData } = useQuery({
    queryKey: ["ttl", roomId, connection.id],
    queryFn: async () => {
      const res = await client.room.ttl.get({ query: { roomId } });
      if (res.error && (res.status === 401 || res.status === 404)) { onExpire("error"); return null; }
      if (res.error || !res.data || !("ttl" in res.data)) throw new Error("Room heartbeat unavailable");
      return res.data;
    },
    enabled: isConnected,
    refetchInterval: PRESENCE_HEARTBEAT_MS,
    refetchIntervalInBackground: true,
    retry: false,
  });

  useEffect(() => {
    if (ttlData?.others !== undefined && otherUsersCountRef) otherUsersCountRef.current = ttlData.others;
    if (ttlData?.ttl !== undefined && ttlData.ttl !== lastSyncedValue.current) {
      setSecondsRemaining(ttlData.ttl);
      if (ttlData.initialTtl) {
        setInitialSeconds(ttlData.initialTtl);
        try {
          sessionStorage.setItem(`${storageKey}_initial`, String(ttlData.initialTtl));
        } catch {}
      } else {
        setInitialSeconds((prev) => (prev === null ? ttlData.ttl : Math.max(prev, ttlData.ttl)));
      }
      try {
        sessionStorage.setItem(storageKey, JSON.stringify({ ttl: ttlData.ttl, timestamp: Date.now() }));
      } catch {}
      lastSyncedValue.current = ttlData.ttl;
    }
  }, [ttlData, storageKey, otherUsersCountRef]);

  const isRunning = secondsRemaining !== null;
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  useEffect(() => {
    if (isConnected && ttlData && secondsRemaining === 0) onExpire("destroyed");
  }, [secondsRemaining, onExpire, isConnected, ttlData]);

  return { secondsRemaining, initialSeconds };
};
