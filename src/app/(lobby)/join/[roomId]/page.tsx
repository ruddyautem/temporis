"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import useUsername from "@/hooks/use-username";
import JoinScreen from "@/components/join/JoinScreen";
import Panel from "@/components/common/Panel";
import Button from "@/components/common/Button";
import BrandMark from "@/components/common/BrandMark";

export default function JoinPage() {
  const { username } = useUsername();
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  if (!isMounted) {
    return (
      <div className="flex h-32 items-center justify-center">
        <span className="h-3 w-3 rounded-full bg-emerald-500 animate-ping shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
      </div>
    );
  }

  // Handles new users joining via invite link
  if (!username) {
    return (
      <>
        <BrandMark />
        <Panel>
          <div className="p-6 md:p-10 space-y-6 text-center">
            <p className="text-[10px] md:text-[11px] uppercase tracking-widest text-slate-500">
              Identité requise
            </p>
            <h2 className="text-sm md:text-base text-slate-200">
              Vous devez générer une identité anonyme avant de rejoindre cette session.
            </h2>
            <Button 
              variant="primary" 
              className="w-full" 
              onClick={() => router.push("/")}
            >
              Créer mon identité
            </Button>
          </div>
        </Panel>
      </>
    );
  }

  return (
    <JoinScreen
      username={username}
      roomId={roomId}
      onJoin={() => router.push(`/room/${roomId}`)}
      onDecline={() => router.push("/")}
    />
  );
}