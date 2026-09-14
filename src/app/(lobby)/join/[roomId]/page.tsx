"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import useUsername from "@/hooks/use-username";
import JoinScreen from "@/components/join/JoinScreen";

export default function JoinPage() {
  const { username, regenerateUsername } = useUsername();
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
    // Prefetch room TTL so the timer laser bar has the exact remaining time immediately upon entering
    if (roomId) {
      import("@/lib/client").then(({ client }) => {
        client.room.ttl.get({ query: { roomId } }).then((res) => {
          if (res.data?.ttl !== undefined) {
            try {
              sessionStorage.setItem(
                `temporis_ttl_${roomId}`,
                JSON.stringify({ ttl: res.data.ttl, timestamp: Date.now() })
              );
              if (res.data.initialTtl) {
                sessionStorage.setItem(`temporis_ttl_${roomId}_initial`, String(res.data.initialTtl));
              }
            } catch {}
          }
        }).catch(() => {});
      });
    }
  }, [roomId]);

  if (!isMounted) {
    return (
      <div className="flex h-32 items-center justify-center">
        <span className="h-3 w-3 rounded-full bg-emerald-500 animate-ping shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
      </div>
    );
  }

  return (
    <JoinScreen
      username={username}
      roomId={roomId}
      onRegenerateUsername={regenerateUsername}
      onJoin={() => router.push(`/room/${roomId}${window.location.hash}`)}
      onDecline={() => router.push("/")}
    />
  );
}