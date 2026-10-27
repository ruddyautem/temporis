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
  }, []);

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
      onRegenerateUsername={regenerateUsername}
      onJoin={() => router.push(`/room/${roomId}${window.location.hash}`)}
      onDecline={() => router.push("/")}
    />
  );
}