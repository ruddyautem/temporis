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
    <div className='flex flex-col flex-1 sm:flex-initial w-full font-mono gap-3 sm:gap-6 min-h-0 sm:min-h-fit'>
      {/* Brand Header */}
      <BrandMark />

      {/* Cyberpunk Card (brighter, higher contrast and clean) */}
      <div className='border border-emerald-500/25 bg-[#0c1522]/90 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] relative rounded-none overflow-hidden flex flex-col flex-1 sm:flex-initial min-h-0 sm:min-h-fit'>
        {/* Tactical Corner Accents */}
        <div className='absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-emerald-400/80 z-10' />
        <div className='absolute top-0 right-0 w-2.5 h-2.5 border-t border-r border-emerald-400/80 z-10' />
        <div className='absolute bottom-0 left-0 w-2.5 h-2.5 border-b border-l border-emerald-400/80 z-10' />
        <div className='absolute bottom-0 right-0 w-2.5 h-2.5 border-b border-r border-emerald-400/80 z-10' />

        {/* Anonymous Identity Header */}
        <div className='flex items-center justify-between border-b border-emerald-500/20 bg-emerald-950/20 px-4 py-3 sm:py-3.5 2xl:py-5 sm:px-6 2xl:px-8 shrink-0'>
          <div className='flex items-center gap-3 sm:gap-3.5 min-w-0'>
            <div className='flex h-8 w-8 sm:h-8 sm:w-8 2xl:h-9 2xl:w-9 shrink-0 items-center justify-center rounded-none border border-emerald-500/30 bg-emerald-500/10 text-emerald-400'>
              <Icon name='user' className='h-4 w-4 sm:h-4 sm:w-4 2xl:h-4.5 2xl:w-4.5' />
            </div>
            <div className='min-w-0'>
              <div className='text-[10px] sm:text-[10px] 2xl:text-[11px] uppercase tracking-wider text-emerald-400/80 font-bold'>
                {tCommon("identity")}
              </div>
              <div className='text-xs sm:text-sm 2xl:text-base font-bold text-slate-100 truncate tracking-wide'>
                {username || tCommon("loading")}
              </div>
            </div>
          </div>

          <button
            type='button'
            onClick={handleRegenerate}
            title={tCommon("reroll")}
            className='group flex items-center gap-1.5 sm:gap-2 rounded-none border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 sm:px-3 sm:py-1.5 2xl:px-3.5 2xl:py-2 text-[11px] sm:text-xs font-bold text-emerald-300 hover:bg-emerald-500/20 hover:border-emerald-400 active:scale-95 transition-all cursor-pointer'
          >
            <Icon
              name='refresh'
              className={`h-3.5 w-3.5 sm:h-3.5 sm:w-3.5 2xl:h-4 2xl:w-4 transition-transform duration-300 ${
                isRegenerating ? "rotate-180 text-emerald-200" : "group-hover:rotate-45"
              }`}
            />
            <span className='tracking-wider'>{tCommon("reroll")}</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* MOBILE CONTENT AREA (sm:hidden) - STRICTLY KEPT INTACT AS APPROVED        */}
        {/* ========================================================================= */}
        <div className='sm:hidden p-4 flex flex-col flex-1 justify-between gap-4 min-h-0 overflow-y-auto'>
          <div className='flex flex-col flex-1 justify-between rounded-none border border-emerald-500/20 bg-emerald-950/15 p-3.5 gap-4'>
            {/* Security specifications */}
            <div className='space-y-3'>
              <div className='flex items-start gap-3'>
                <div className='flex h-7 w-7 shrink-0 items-center justify-center rounded-none bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mt-0.5'>
                  <Icon name='clock' className='h-3.5 w-3.5' />
                </div>
                <div className='text-xs text-slate-300 leading-snug'>
                  <span>{t("roomInfoAutoDelete", { ttl })}</span>
                </div>
              </div>

              <div className='flex items-start gap-3'>
                <div className='flex h-7 w-7 shrink-0 items-center justify-center rounded-none bg-red-500/10 text-red-400 border border-red-500/20 mt-0.5'>
                  <Icon name='trash' className='h-3.5 w-3.5 text-red-400' />
                </div>
                <div className='text-xs text-slate-300 leading-snug'>
                  <span>{t("roomInfoNoHistory")}</span>
                </div>
              </div>
            </div>

            {/* Slider on mobile */}
            <div className='space-y-2'>
              <div className='flex items-center justify-between text-xs'>
                <span className='text-[10px] uppercase tracking-wider font-bold text-slate-300'>
                  {t("ttlHeader")}
                </span>
                <span className='text-[10px] text-emerald-400 font-semibold tracking-wider flex items-center gap-1.5'>
                  <span className='inline-block w-1.5 h-1.5 bg-emerald-400 animate-pulse' />
                  <span className='font-bold tabular-nums text-emerald-300 text-xs'>{ttl}</span>
                  <span className='text-[10px] uppercase text-emerald-400/80'>{t("minutes")}</span>
                </span>
              </div>

              <div className='rounded-none border border-emerald-500/25 bg-[#0b1420]/80 p-4 space-y-4'>
                <div className='relative flex items-center h-8'>
                  <div className='absolute left-[11px] right-[11px] h-1.5 bg-slate-800 border border-slate-700/60 pointer-events-none' />
                  <div
                    className='absolute left-[11px] h-1.5 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)] pointer-events-none transition-all duration-150'
                    style={{
                      width: `calc(${(TTL_OPTIONS.indexOf(ttl) / (TTL_OPTIONS.length - 1)) * 100}% - ${(TTL_OPTIONS.indexOf(ttl) / (TTL_OPTIONS.length - 1)) * 22}px)`,
                    }}
                  />
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
                      if (TTL_OPTIONS[idx]) setTtl(TTL_OPTIONS[idx]);
                    }}
                    aria-label={t("ttlHeader")}
                    className='temporis-slider relative z-20'
                  />
                </div>

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
                        <span className={`text-xs font-black tabular-nums font-mono ${active ? "text-emerald-300" : "text-slate-400"}`}>
                          {minutes}
                        </span>
                        <span className='text-[8px] uppercase tracking-widest font-semibold opacity-80'>
                          min
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* DESKTOP CONTENT AREA (hidden sm:flex) - GRAND CYBER COMMAND DECK          */}
        {/* ========================================================================= */}
        <div className='lobby-card-content hidden sm:flex flex-col p-4 md:p-6 lg:p-6 2xl:p-10 gap-3 md:gap-5 lg:gap-4 2xl:gap-8'>
          {/* Top Interactive Row: 3 Tactical Status Cards */}
          <div className='lobby-top-cards grid grid-cols-3 gap-3 md:gap-4 2xl:gap-6'>
            {/* Card 1: End-to-End Encryption */}
            <div className='lobby-top-card relative p-3 md:p-4 lg:p-3.5 2xl:p-6 border border-emerald-500/20 bg-[#09111c]/80 group hover:border-emerald-400/40 transition-all'>
              <div className='absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-emerald-400' />
              <div className='flex items-center gap-2.5 md:gap-3 2xl:gap-4 mb-1 md:mb-2 2xl:mb-3'>
                <div className='flex h-7 w-7 md:h-8 md:w-8 2xl:h-10 2xl:w-10 shrink-0 items-center justify-center bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'>
                  <Icon name='shield' className='h-3.5 w-3.5 md:h-4 md:w-4 2xl:h-5 2xl:w-5' />
                </div>
                <div>
                  <div className='text-[9px] md:text-[9.5px] 2xl:text-xs uppercase font-bold tracking-widest text-emerald-400/80'>Protocole</div>
                  <div className='text-[11px] md:text-xs 2xl:text-sm font-bold text-slate-100 uppercase tracking-wider'>E2EE AES-GCM</div>
                </div>
              </div>
              <p className='text-[10px] md:text-[11px] 2xl:text-xs text-slate-300/90 leading-snug 2xl:leading-relaxed'>
                Clés dérivées localement dans votre navigateur. Le serveur ne lit jamais vos échanges.
              </p>
            </div>

            {/* Card 2: Zero Logs / Ram Storage */}
            <div className='lobby-top-card relative p-3 md:p-4 lg:p-3.5 2xl:p-6 border border-emerald-500/20 bg-[#09111c]/80 group hover:border-emerald-400/40 transition-all'>
              <div className='absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-emerald-400' />
              <div className='flex items-center gap-2.5 md:gap-3 2xl:gap-4 mb-1 md:mb-2 2xl:mb-3'>
                <div className='flex h-7 w-7 md:h-8 md:w-8 2xl:h-10 2xl:w-10 shrink-0 items-center justify-center bg-red-500/10 border border-red-500/20 text-red-400'>
                  <Icon name='trash' className='h-3.5 w-3.5 md:h-4 md:w-4 2xl:h-5 2xl:w-5 text-red-400' />
                </div>
                <div>
                  <div className='text-[9px] md:text-[9.5px] 2xl:text-xs uppercase font-bold tracking-widest text-red-400/80'>Persistance</div>
                  <div className='text-[11px] md:text-xs 2xl:text-sm font-bold text-slate-100 uppercase tracking-wider'>Zéro Trace</div>
                </div>
              </div>
              <p className='text-[10px] md:text-[11px] 2xl:text-xs text-slate-300/90 leading-snug 2xl:leading-relaxed'>
                {t("roomInfoNoHistory")} Données volatiles en mémoire vive sans stockage.
              </p>
            </div>

            {/* Card 3: Ephemeral Countdown */}
            <div className='lobby-top-card relative p-3 md:p-4 lg:p-3.5 2xl:p-6 border border-emerald-500/20 bg-[#09111c]/80 group hover:border-emerald-400/40 transition-all'>
              <div className='absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-emerald-400' />
              <div className='flex items-center gap-2.5 md:gap-3 2xl:gap-4 mb-1 md:mb-2 2xl:mb-3'>
                <div className='flex h-7 w-7 md:h-8 md:w-8 2xl:h-10 2xl:w-10 shrink-0 items-center justify-center bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'>
                  <Icon name='clock' className='h-3.5 w-3.5 md:h-4 md:w-4 2xl:h-5 2xl:w-5' />
                </div>
                <div>
                  <div className='text-[9px] md:text-[9.5px] 2xl:text-xs uppercase font-bold tracking-widest text-emerald-400/80'>Délai de vie</div>
                  <div className='text-[11px] md:text-xs 2xl:text-sm font-bold text-emerald-300 uppercase tracking-wider tabular-nums'>
                    {ttl} Minutes chrono
                  </div>
                </div>
              </div>
              <p className='text-[10px] md:text-[11px] 2xl:text-xs text-slate-300/90 leading-snug 2xl:leading-relaxed'>
                {t("roomInfoAutoDelete", { ttl })}
              </p>
            </div>
          </div>

          {/* Central Command Section: Large Duration Configurator & Direct Launch */}
          <div className='lobby-configurator relative border border-emerald-500/25 bg-emerald-950/15 p-4 md:p-6 lg:p-5 2xl:p-8 space-y-4 md:space-y-5 2xl:space-y-6'>
            {/* Top Bar of the Configurator */}
            <div className='flex items-center justify-between border-b border-emerald-500/20 pb-2.5 md:pb-3.5 2xl:pb-4'>
              <div className='flex items-center gap-2.5'>
                <span className='h-2 w-2 bg-emerald-400' />
                <div>
                  <h3 className='text-xs md:text-sm 2xl:text-base font-bold uppercase tracking-[0.2em] text-emerald-400'>
                    {t("ttlHeader")}
                  </h3>
                  <p className='text-[9px] md:text-[9.5px] 2xl:text-xs uppercase tracking-widest text-slate-400'>
                    Choisissez le cycle de vie avant autodestruction complète
                  </p>
                </div>
              </div>

              <div className='flex items-center gap-2 px-3 py-1 md:py-1.5 2xl:px-4 2xl:py-2 border border-emerald-500/25 bg-[#070e17]'>
                <span className='text-[9px] md:text-[9.5px] 2xl:text-xs uppercase tracking-widest text-emerald-400/80 font-bold'>DURÉE SÉLECTIONNÉE :</span>
                <span className='text-base md:text-lg 2xl:text-xl font-black text-emerald-300 font-mono tabular-nums'>{ttl}</span>
                <span className='text-[10px] md:text-[11px] 2xl:text-xs uppercase text-emerald-400/80 font-bold'>MIN</span>
              </div>
            </div>

            {/* Interactive Grid of Duration Cards (Quick Select) */}
            <div className='grid grid-cols-3 gap-3 md:gap-4 2xl:gap-5'>
              {TTL_OPTIONS.map((minutes) => {
                const isSelected = ttl === minutes;
                return (
                  <button
                    key={minutes}
                    type='button'
                    onClick={() => setTtl(minutes)}
                    className={`lobby-duration-btn relative p-3 md:p-4 lg:p-3.5 2xl:p-6 text-left transition-all cursor-pointer border ${
                      isSelected
                        ? "border-emerald-400 bg-emerald-500/15 shadow-sm ring-1 ring-emerald-400/60"
                        : "border-emerald-500/20 bg-[#09111c]/80 hover:border-emerald-400/35 hover:bg-[#0c1624]"
                    }`}
                  >
                    {/* Corner indicator */}
                    {isSelected && (
                      <>
                        <div className='absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-emerald-300' />
                        <div className='absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-emerald-300' />
                      </>
                    )}

                    <div className='flex items-baseline gap-2 mb-1'>
                      <span className={`text-xl md:text-2xl 2xl:text-4xl font-black tabular-nums font-mono ${isSelected ? "text-emerald-300" : "text-slate-300"}`}>
                        {minutes}
                      </span>
                      <span className='text-[9.5px] md:text-[10px] 2xl:text-xs uppercase font-bold tracking-widest text-emerald-400/90'>
                        {t("minutes")}
                      </span>
                    </div>

                    <div className='text-[9.5px] md:text-[10.5px] 2xl:text-xs text-slate-400 font-mono tracking-wide leading-tight'>
                      {minutes === 5 && "Éphémère express · Discussion flash"}
                      {minutes === 15 && "Session standard · Équilibre optimal"}
                      {minutes === 30 && "Session étendue · Échanges approfondis"}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Cyber slider bar */}
            <div className='space-y-1.5 pt-0.5'>
              <div className='relative flex items-center h-7 md:h-8 2xl:h-9'>
                {/* Track background with inset so it sits strictly inside the center points */}
                <div className='absolute left-2.5 right-2.5 h-1.5 bg-slate-900 border border-slate-700/80 pointer-events-none' />
                <div
                  className='absolute left-2.5 h-1.5 bg-emerald-500 pointer-events-none transition-all duration-150'
                  style={{
                    width: `calc(${(TTL_OPTIONS.indexOf(ttl) / (TTL_OPTIONS.length - 1)) * 100}% - ${(TTL_OPTIONS.indexOf(ttl) / (TTL_OPTIONS.length - 1)) * 20}px)`,
                  }}
                />

                <div className='absolute inset-x-0 flex justify-between items-center z-30 pointer-events-none'>
                  {TTL_OPTIONS.map((minutes) => {
                    const isReached = minutes <= ttl;
                    return (
                      <button
                        key={minutes}
                        type='button'
                        onClick={() => setTtl(minutes)}
                        title={`${minutes} ${t("minutes")}`}
                        className={`w-5 h-5 2xl:w-6 2xl:h-6 rounded-none transition-all duration-150 cursor-pointer pointer-events-auto p-0 flex items-center justify-center ${
                          isReached
                            ? "bg-emerald-400 border-2 border-white scale-105"
                            : "bg-slate-800 border border-slate-600 hover:border-emerald-400"
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
                    if (TTL_OPTIONS[idx]) setTtl(TTL_OPTIONS[idx]);
                  }}
                  aria-label={t("ttlHeader")}
                  className='temporis-slider relative z-20 cursor-pointer'
                />
              </div>
            </div>

            {/* Launch CTA Bar - Grand, wide, prominent action block without excessive glow */}
            <div className='pt-2.5 md:pt-3.5 2xl:pt-4 border-t border-emerald-500/20 flex items-center justify-between gap-4 2xl:gap-6'>
              <div className='flex items-center gap-2 text-xs text-slate-400 font-mono'>
                <div className='w-1.5 h-1.5 rounded-none bg-emerald-400' />
                <span className='text-[10px] md:text-[11px] 2xl:text-xs'>Prêt à déployer un salon chiffré unique sans trace serveur</span>
              </div>

              <button
                type='button'
                onClick={() => createRoom(ttl)}
                disabled={isPending}
                className='lobby-cta-btn flex-1 max-w-sm 2xl:max-w-md flex items-center justify-center gap-3 rounded-none border border-emerald-400 bg-emerald-600/25 hover:bg-emerald-500/35 active:bg-emerald-500/40 text-emerald-100 hover:text-white py-2.5 md:py-3.5 2xl:py-4 px-5 2xl:px-8 text-xs lg:text-sm 2xl:text-base font-bold uppercase tracking-[0.2em] transition-all active:scale-[0.99] disabled:opacity-40 cursor-pointer'
              >
                <span>
                  {isPending ? t("creating") : t("desktopCreateButton")}
                </span>
                <Icon
                  name='arrowRight'
                  className='h-4 w-4 2xl:h-5 2xl:w-5 text-emerald-300 stroke-[2.5]'
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Fixed Bottom Action Button */}
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

