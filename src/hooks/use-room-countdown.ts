import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/client";
import type { RoomExitReason } from "./use-room-session";

/**
 * Polls the room's remaining TTL and ticks it down locally between polls,
 * so the countdown stays smooth without hammering the API every second.
 * Calls onExpire once when the timer hits zero.
 */
export const useRoomCountdown = (
  roomId: string,
  onExpire: (reason: RoomExitReason) => void,
) => {
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
    queryKey: ["ttl", roomId],
    queryFn: async () => {
      const res = await client.room.ttl.get({ query: { roomId } });
      return res.data;
    },
    refetchInterval: 10000,
    retry: false,
  });

  useEffect(() => {
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
  }, [ttlData, storageKey]);

  const isRunning = secondsRemaining !== null;
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  useEffect(() => {
    if (secondsRemaining === 0) onExpire("destroyed");
  }, [secondsRemaining, onExpire]);

  return { secondsRemaining, initialSeconds };
};