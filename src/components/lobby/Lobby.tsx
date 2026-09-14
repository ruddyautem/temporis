"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import useUsername from "@/hooks/use-username";
import { client } from "@/lib/client";
import { TTL_OPTIONS, type RoomTtlMinutes } from "@/lib/room-config";
import { Icon } from "@/components/Icons";
import BrandMark from "@/components/common/BrandMark";

export default function Lobby() {
  const t = useTranslations("Lobby");
  const tCommon = useTranslations("Common");
  const { username, regenerateUsername } = useUsername();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [ttl, setTtl] = useState<RoomTtlMinutes>(15);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const destroyed = searchParams.get("destroyed") === "true";
  const errorParam = searchParams.get("error");

  useEffect(() => {
    if (destroyed) {
      toast.error(t("toastRoomDestroyed"), { id: "room-destroyed-toast" });
    } else if (errorParam === "room-not-found") {
      toast.error(t("toastNotFound"), { id: "room-not-found-toast" });
    } else if (errorParam === "room-full") {
      toast.error(t("toastFull"), { id: "room-full-toast" });
    }

    if (destroyed || errorParam) window.history.replaceState({}, "", "/");
  }, [destroyed, errorParam, t]);

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
      const anyRes = res as unknown as { error?: unknown; data?: { roomId?: string }; status?: number };
      if (anyRes.error) {
        throw new Error(
          typeof anyRes.error === "string"
            ? anyRes.error
            : JSON.stringify(anyRes.error) || "Network error"
        );
      }
      if (anyRes.data?.roomId) {
        return { roomId: anyRes.data.roomId };
      }
      throw new Error(`Status ${anyRes.status || "unknown"}`);
    },
    onSuccess: async (data) => {
      try {
        const { generateRoomKey, exportKeyToBase64 } = await import("@/lib/crypto");
        const secretKey = await generateRoomKey();
        const exportedKey = await exportKeyToBase64(secretKey);
        toast.success(t("toastRoomCreated"));
        router.push(`/room/${data.roomId}#key=${exportedKey}`);
      } catch (err: unknown) {
        console.error("Key generation failed:", err);
        const errMsg = err instanceof Error ? err.message : String(err);
        toast.error(
          errMsg.includes("Crypto") || !window.isSecureContext
            ? "Erreur WebCrypto : HTTPS ou localhost requis pour le chiffrement."
            : t("toastCreationError")
        );
      }
    },
    onError: (error) => {
      console.error("Room creation error:", error);
      toast.error(error.message || t("toastCreationError"));
    },
  });

  const handleRegenerate = () => {
    setIsRegenerating(true);
    regenerateUsername();
    setTimeout(() => setIsRegenerating(false), 300);
  };

  return (
    <div className='flex flex-col flex-1 w-full font-mono gap-4 sm:gap-6'>
      {/* Brand Header */}
      <BrandMark />

      {/* Cyberpunk Card (brighter, higher contrast and clean) */}
      <div className='border border-emerald-500/25 bg-[#0c1522]/90 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] relative rounded-none overflow-hidden flex flex-col flex-1'>
        {/* Tactical Corner Accents */}
        <div className='absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-emerald-400/80 z-10' />
        <div className='absolute top-0 right-0 w-2.5 h-2.5 border-t border-r border-emerald-400/80 z-10' />
        <div className='absolute bottom-0 left-0 w-2.5 h-2.5 border-b border-l border-emerald-400/80 z-10' />
        <div className='absolute bottom-0 right-0 w-2.5 h-2.5 border-b border-r border-emerald-400/80 z-10' />

        {/* Anonymous Identity Header */}
        <div className='flex items-center justify-between border-b border-emerald-500/20 bg-emerald-950/20 px-4 py-4 sm:px-6'>
          <div className='flex items-center gap-3 min-w-0'>
            <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-none border border-emerald-500/30 bg-emerald-500/10 text-emerald-400'>
              <Icon name='user' className='h-4 w-4' />
            </div>
            <div className='min-w-0'>
              <div className='text-[10px] uppercase tracking-wider text-emerald-400/80 font-bold'>
                {tCommon("identity")}
              </div>
              <div className='text-xs sm:text-sm font-bold text-slate-100 truncate tracking-wide'>
                {username || tCommon("loading")}
              </div>
            </div>
          </div>

          <button
            type='button'
            onClick={handleRegenerate}
            title={tCommon("reroll")}
            className='group flex items-center gap-1.5 rounded-none border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-bold text-emerald-300 hover:bg-emerald-500/20 hover:border-emerald-400 active:scale-95 transition-all cursor-pointer'
          >
            <Icon
              name='refresh'
              className={`h-3.5 w-3.5 transition-transform duration-300 ${
                isRegenerating ? "rotate-180 text-emerald-200" : "group-hover:rotate-45"
              }`}
            />
            <span className='tracking-wider'>{tCommon("reroll")}</span>
          </button>
        </div>

        {/* Content Area */}
        <div className='p-4 sm:p-8 flex-1 sm:flex-initial flex flex-col justify-between sm:justify-start gap-5 sm:gap-7'>
          {/* Main Encadré: on mobile, it wraps the full vertical space with info on top and timers at its bottom */}
          <div className='flex-1 sm:flex-initial flex flex-col justify-between sm:justify-start rounded-none border border-emerald-500/20 bg-emerald-950/15 p-4 sm:p-0 sm:border-0 sm:bg-transparent gap-5 sm:gap-7'>
            {/* Info Container: single unified container on desktop, matching encadré on mobile */}
            <div className='rounded-none sm:border sm:border-emerald-500/20 sm:bg-emerald-950/15 sm:p-4 space-y-3 sm:space-y-3.5'>
              {/* Auto-delete item */}
              <div className='flex items-center gap-3'>
                <div className='flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-none bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'>
                  <Icon name='clock' className='h-3.5 w-3.5 sm:h-4 sm:w-4' />
                </div>
                <div className='text-xs sm:text-xs text-slate-300 leading-relaxed min-h-[2.5rem] sm:min-h-0 flex items-center'>
                  <span>{t("roomInfoAutoDelete", { ttl })}</span>
                </div>
              </div>

              {/* Divider on desktop */}
              <div className='hidden sm:block h-px w-full bg-emerald-500/15' />

              {/* Red trash item with 'Aucun historique n'est conservé' */}
              <div className='flex items-center gap-3'>
                <div className='flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-none bg-red-500/10 text-red-400 border border-red-500/20'>
                  <Icon name='trash' className='h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-400' />
                </div>
                <div className='text-xs text-slate-300 leading-relaxed flex items-center'>
                  {t("roomInfoNoHistory")}
                </div>
              </div>
            </div>

            {/* Tactical Duration Slider & Header: at the bottom of the encadré on mobile, top on desktop */}
            <div className='space-y-4 sm:space-y-5 sm:-order-1 mt-6 sm:mt-0 pt-4 sm:pt-0'>
              <div className='flex items-center justify-between text-xs'>
                <span className='text-[10px] sm:text-[11px] uppercase tracking-wider font-bold text-slate-300'>
                  {t("ttlHeader")}
                </span>
                <span className='text-[10px] sm:text-[11px] text-emerald-400 font-semibold tracking-wider flex items-center gap-1.5'>
                  <span className='inline-block w-1.5 h-1.5 bg-emerald-400 animate-pulse' />
                  <span className='font-bold tabular-nums text-emerald-300 text-xs sm:text-sm'>{ttl}</span>
                  <span className='text-[10px] uppercase text-emerald-400/80'>{t("minutes")}</span>
                </span>
              </div>

              {/* Tactical Cyber Slider Container */}
              <div className='rounded-none border border-emerald-500/25 bg-[#0b1420]/80 p-4 sm:p-5 space-y-4'>
                <div className='relative flex items-center h-8'>
                  {/* Slider Track Background & Glow */}
                  <div className='absolute inset-x-0 h-1.5 bg-slate-800 border border-slate-700/60 pointer-events-none' />
                  {/* Active track filling up to current thumb */}
                  <div
                    className='absolute left-0 h-1.5 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)] pointer-events-none transition-all duration-150'
                    style={{
                      width: `${(TTL_OPTIONS.indexOf(ttl) / (TTL_OPTIONS.length - 1)) * 100}%`,
                    }}
                  />

                  {/* Step squares directly on the track at each step (5, 15, 30) - fully clickable */}
                  <div className='absolute inset-x-0 flex justify-between items-center z-30 pointer-events-none'>
                    {TTL_OPTIONS.map((minutes) => {
                      const isReached = minutes <= ttl;
                      return (
                        <button
                          key={minutes}
                          type='button'
                          onClick={() => setTtl(minutes)}
                          title={`${minutes} ${t("minutes")}`}
                          className={`w-[22px] h-[22px] rounded-none transition-all duration-150 cursor-pointer pointer-events-auto p-0 flex items-center justify-center ${
                            isReached
                              ? "bg-emerald-500 border-2 border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.7)]"
                              : "bg-slate-800/90 border border-slate-700/60 shadow-inner hover:border-slate-500"
                          }`}
                        />
                      );
                    })}
                  </div>

                  <input
                    type='range'
                    min={0}
                    max={TTL_OPTIONS.length - 1}
                    step={1}
                    value={TTL_OPTIONS.indexOf(ttl)}
                    onChange={(e) => {
                      const idx = Number(e.target.value);
                      if (TTL_OPTIONS[idx]) {
                        setTtl(TTL_OPTIONS[idx]);
                      }
                    }}
                    aria-label={t("ttlHeader")}
                    className='temporis-slider relative z-20'
                  />
                </div>

                {/* Step indicators & labels */}
                <div className='flex justify-between items-center pt-1'>
                  {TTL_OPTIONS.map((minutes) => {
                    const active = ttl === minutes;
                    return (
                      <button
                        key={minutes}
                        type='button'
                        onClick={() => setTtl(minutes)}
                        className={`group flex flex-col items-center gap-0.5 transition-all cursor-pointer ${
                          active ? "text-emerald-300 scale-105" : "text-slate-500 hover:text-slate-300"
                        }`}
                      >
                        <span className={`text-xs sm:text-sm font-black tabular-nums font-mono ${active ? "text-emerald-300" : "text-slate-400"}`}>
                          {minutes}
                        </span>
                        <span className='text-[8px] sm:text-[9px] uppercase tracking-widest font-semibold opacity-80'>
                          min
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Action Button - Refined, elegant, at the bottom of the card on desktop */}
          <div className='hidden sm:block'>
            <button
              type='button'
              onClick={() => createRoom(ttl)}
              disabled={isPending}
              className='w-full flex items-center justify-center gap-2.5 rounded-none border border-emerald-500/60 bg-emerald-600/25 hover:bg-emerald-500/35 hover:border-emerald-400 text-emerald-100 py-3.5 text-xs md:text-sm font-bold uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(16,185,129,0.18)] transition-all active:scale-[0.99] disabled:opacity-40 cursor-pointer'
            >
              <span>
                {isPending ? t("creating") : t("desktopCreateButton")}
              </span>
              <Icon
                name='arrowRight'
                className='h-4 w-4 text-emerald-300 stroke-[2.5]'
              />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Fixed Bottom Action Button - Refined look */}
      <div className='sm:hidden fixed bottom-0 left-0 right-0 z-[60] p-4 bg-[#0a121d]/95 border-t border-emerald-500/25 backdrop-blur-2xl shadow-[0_-10px_30px_rgba(0,0,0,0.8)] pointer-events-auto'>
        <div className='max-w-md mx-auto'>
          <button
            type='button'
            onClick={() => createRoom(ttl)}
            disabled={isPending}
            className='w-full flex items-center justify-center gap-2.5 rounded-none border border-emerald-500/60 bg-emerald-600/30 active:bg-emerald-500/40 text-emerald-100 py-3.5 font-bold uppercase tracking-widest text-xs shadow-[0_0_20px_rgba(16,185,129,0.2)] active:scale-98 disabled:opacity-40 cursor-pointer touch-manipulation select-none'
          >
            <span>
              {isPending ? t("creating") : t("createButton")}
            </span>
            <Icon
              name='arrowRight'
              className='h-4 w-4 text-emerald-300 stroke-[2.5]'
            />
          </button>
        </div>
      </div>
    </div>
  );
}

