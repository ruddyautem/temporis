"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import useUsername from "@/hooks/use-username";
import { client } from "@/lib/client";
import { ROOM_STATUS_MESSAGES, type RoomTtlMinutes } from "@/lib/room-config";
import { Icon } from "@/components/Icons";
import BrandMark from "@/components/common/BrandMark";
import TrustBadges from "@/components/common/TrustBadges";
import Panel from "@/components/common/Panel";
import RoomStatusBanner from "./RoomStatusBanner";
import RoomDurationPicker from "./RoomDurationPicker";

export default function Lobby() {
  const { username } = useUsername();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [ttl, setTtl] = useState<RoomTtlMinutes>();

  const destroyed = searchParams.get("destroyed") === "true";
  const errorParam = searchParams.get("error");
  const statusKey = destroyed ? "destroyed" : errorParam;
  const status = statusKey ? ROOM_STATUS_MESSAGES[statusKey] : null;

  useEffect(() => {
    if (destroyed) toast.error("LA ROOM A ÉTÉ DÉTRUITE", { toastId: "d" });
    else if (errorParam === "room-not-found")
      toast.error("ROOM INTROUVABLE", { toastId: "e" });
    else if (errorParam === "room-full")
      toast.error("ROOM COMPLÈTE", { toastId: "f" });

    if (destroyed || errorParam) window.history.replaceState({}, "", "/");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { mutate: createRoom, isPending } = useMutation<
    { roomId: string },
    Error,
    RoomTtlMinutes
  >({
    mutationKey: ["createRoom"],
    mutationFn: async (minutes) => {
      const res = await client.room.create.post(
        {},
        { query: { ttl: String(minutes) } },
      );
      if (res.status === 200 && res.data?.roomId) {
        return { roomId: res.data.roomId };
      }
      throw new Error(`Échec de création (status ${res.status})`);
    },
    onSuccess: (data) => {
      toast.success("Room créée !");
      router.push(`/room/${data.roomId}`);
    },
    onError: (error) => {
      console.error("Room creation error:", error);
      toast.error("Erreur lors de la création.");
    },
  });

  return (
    <>
      <BrandMark
        badge={
          <div className='inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/[0.07] px-3 py-1 sm:px-4 sm:py-1.5 text-[9px] sm:text-[11px] md:text-xs font-medium uppercase tracking-widest text-emerald-400'>
            <Icon name='shield' />
            <span>Chiffrement de bout en bout</span>
          </div>
        }
      />

      <RoomStatusBanner status={status} />

      <Panel>
        <div className='flex items-center justify-between border-b border-slate-700/50 bg-[#060d14]/60 px-4 py-4 sm:px-6 sm:py-5 gap-3 flex-col md:flex-row'>
          <div className='flex items-center gap-2 text-[9px] sm:text-[10px] md:text-[11px] uppercase tracking-widest text-slate-500 shrink-0'>
            <Icon name='user' />
            <span>Votre Identité Anonyme</span>
          </div>
          <div className='flex items-center gap-2 sm:gap-2.5 min-w-0'>
            <span className='md:hidden h-2 w-2 shrink-0 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)] animate-pulse' />
            <span className='font-mono text-xs sm:text-sm md:text-base font-semibold text-emerald-200/90 break-all text-center md:text-right'>
              {username}
            </span>
            <span className='hidden md:block h-2 w-2 shrink-0 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)] animate-pulse' />
          </div>
        </div>

        <div className='p-5 sm:p-7 md:p-10 space-y-7 sm:space-y-8 md:space-y-9'>
          <RoomDurationPicker
            value={ttl}
            onChange={setTtl}
            disabled={isPending}
          />

          <button
            onClick={() =>
              ttl ? createRoom(ttl) : toast.info("Choisissez une durée de vie.")
            }
            disabled={isPending}
            className='group relative w-full overflow-hidden rounded-xl border border-emerald-500/25 bg-emerald-500/10 py-4 text-[11px] sm:text-[12px] md:text-[13px] font-bold uppercase tracking-[0.25em] sm:tracking-[0.3em] text-emerald-300 transition-all hover:bg-emerald-500/18 hover:border-emerald-500/40 active:scale-[0.98] disabled:opacity-40 cursor-pointer'
          >
            <span className='relative z-10'>
              {isPending ? "Initialisation…" : "Créer la room"}
            </span>
            <div className='absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-emerald-500/5 to-transparent transition-transform duration-700 group-hover:translate-x-full' />
          </button>
        </div>
      </Panel>

      <TrustBadges />
    </>
  );
}
