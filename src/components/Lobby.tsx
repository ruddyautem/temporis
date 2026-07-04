"use client";
import React, { useState, useEffect, Fragment } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import useUsername from "@/hooks/use-username";
import { useMutation } from "@tanstack/react-query";
import { client } from "@/lib/client";
import { toast } from "react-toastify";
import Footer from "./Footer";
import { Icon, IconName } from "./Icons";

const TTL_OPTIONS = [5, 15, 30] as const;
type Ttl = (typeof TTL_OPTIONS)[number];

const FEATURES: { icon: IconName; label: string }[] = [
  { icon: "lock", label: "E2EE" },
  { icon: "trash", label: "Sans rétention" },
  { icon: "clock", label: "Auto-destruction" },
];

const STATUS_MAP: Record<string, { text: string; cls: string }> = {
  destroyed: { text: "Cette room a été détruite.", cls: "text-red-400" },
  "room-not-found": {
    text: "Room introuvable ou expirée.",
    cls: "text-orange-400",
  },
  "room-full": { text: "La room est complète.", cls: "text-yellow-400" },
};

export default function Lobby() {
  const { username } = useUsername();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [ttl, setTtl] = useState<Ttl>();

  useEffect(() => {
    const destroyed = searchParams.get("destroyed") === "true";
    const error = searchParams.get("error") as string | null;

    if (destroyed) toast.error("LA ROOM A ÉTÉ DÉTRUITE", { toastId: "d" });
    else if (error === "room-not-found")
      toast.error("ROOM INTROUVABLE", { toastId: "e" });
    else if (error === "room-full")
      toast.error("ROOM COMPLÈTE", { toastId: "f" });

    if (destroyed || error) window.history.replaceState({}, "", "/");
  }, []);

  const { mutate: createRoom, isPending } = useMutation({
    mutationFn: async (minutes: Ttl) => {
      const res = await client.room.create.post(
        {},
        { query: { ttl: String(minutes) } },
      );
      if (res.status === 200 && res.data?.roomId) {
        toast.success("Room créée !");
        router.push(`/room/${res.data.roomId}`);
      } else {
        toast.error("Erreur lors de la création.");
      }
    },
  });

  const destroyedParam = searchParams.get("destroyed") === "true";
  const errorParam = searchParams.get("error");
  const statusKey = destroyedParam ? "destroyed" : (errorParam ?? null);
  const status = statusKey ? STATUS_MAP[statusKey] : null;

  return (
    <main className='relative flex min-h-dvh flex-col bg-[#0d1621] text-slate-100 overflow-hidden selection:bg-emerald-500/20'>
      {/* Ambient background */}
      <div className='pointer-events-none absolute inset-0'>
        <div className='absolute -top-32 -left-32 w-125 h-125 rounded-full bg-emerald-500/4 blur-[100px]' />
        <div className='absolute -bottom-32 -right-32 w-125 h-125 rounded-full bg-emerald-600/4 blur-[100px]' />
        <div
          className='absolute inset-0 opacity-[0.03]'
          style={{
            backgroundImage:
              "linear-gradient(rgba(16,185,129,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.8) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className='relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-10 sm:px-6 sm:py-12'>
        <div className='w-full max-w-sm sm:max-w-md md:max-w-lg space-y-6  '>
          <div className='text-center'>
            <h1 className='text-5xl sm:text-6xl md:text-7xl font-black tracking-tight text-white leading-none'>
              <span className='text-emerald-400'>{">"}</span>
              Tempor<span className='text-emerald-400'>is</span>
            </h1>
            <p className='mt-2 sm:mt-3 text-[10px] sm:text-[11px] md:text-xs uppercase tracking-[0.35em] sm:tracking-[0.45em] text-slate-500'>
              Rooms éphémères · Zéro trace
            </p>
            <div className='mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/[0.07] px-3 py-1 sm:px-4 sm:py-1.5 text-[9px] sm:text-[11px] md:text-xs font-medium uppercase tracking-widest text-emerald-400'>
              <Icon name='shield' />
              <span className='xs:hidden'>Chiffrement de bout en bout</span>
            </div>
          </div>

          {/* ── Alert banner ── */}
          {status && (
            <div
              className={`flex items-center gap-2.5 rounded-xl border border-current/20 bg-current/5 px-4 py-3 text-xs sm:text-sm md:text-base ${status.cls}`}
            >
              <span className='h-1.5 w-1.5 shrink-0 rounded-full bg-current animate-pulse' />
              {status.text}
            </div>
          )}

          {/* ── Main card ── */}
          <div className='rounded-2xl border border-slate-700/50 bg-slate-900/60 backdrop-blur-xl shadow-[0_0_60px_rgba(0,0,0,0.5)] overflow-hidden'>
            {/* Identity row */}
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
              {/* TTL section */}
              <div>
                {/* Mobile/Tablet: centered with bars on both sides */}
                <div className='mb-4 sm:mb-5 flex items-center gap-3 md:hidden'>
                  <div className='h-px flex-1 bg-slate-700/60' />
                  <span className='text-[9px] sm:text-[10px] uppercase tracking-widest text-slate-500 whitespace-nowrap'>
                    Durée de vie
                  </span>
                  <div className='h-px flex-1 bg-slate-700/60' />
                </div>
                <div className='mb-4 sm:mb-5 hidden md:flex items-center gap-3'>
                  <span className='text-[10px] md:text-[11px] uppercase tracking-widest text-slate-500 whitespace-nowrap'>
                    Durée de vie
                  </span>
                  <div className='h-px flex-1 bg-slate-700/60' />
                </div>

                <div className='grid grid-cols-3 gap-2.5 sm:gap-3 md:gap-4'>
                  {TTL_OPTIONS.map((min) => {
                    const active = ttl === min;
                    return (
                      <button
                        key={min}
                        onClick={() => setTtl(min)}
                        disabled={isPending}
                        className={`group relative rounded-xl border py-5 sm:py-6 text-center transition-all duration-200 cursor-pointer ${
                          active
                            ? "border-emerald-500/40 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.12)]"
                            : "border-slate-700/60 bg-slate-800/30 hover:border-slate-600 hover:bg-slate-800/60"
                        }`}
                      >
                        <span
                          className={`block text-2xl sm:text-3xl md:text-4xl font-black tabular-nums leading-none ${active ? "text-emerald-300" : "text-slate-300"}`}
                        >
                          {min}
                        </span>
                        <span
                          className={`mt-1.5 sm:mt-2 block text-[8px] sm:text-[9px] md:text-[10px] uppercase tracking-[0.3em] ${active ? "text-emerald-500/70" : "text-slate-600"}`}
                        >
                          min
                        </span>
                        {active && (
                          <span className='absolute top-2 right-2 sm:top-2.5 sm:right-2.5 flex h-1.5 w-1.5 rounded-full bg-emerald-500' />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Info text */}
                <div className='mt-4 sm:mt-5'>
                  {ttl ? (
                    <div className='space-y-2'>
                      <p className='text-center text-[10px] sm:text-[11px] md:text-xs text-slate-500'>
                        La room s'autodétruira{" "}
                        <span className='text-emerald-400/80 font-medium'>
                          {ttl} minutes
                        </span>{" "}
                        après sa création
                      </p>
                      <div className='flex items-center justify-center gap-2 text-[9px] sm:text-[10px] md:text-[11px] text-slate-600'>
                        <Icon name='trash' />
                        <span>Aucun historique n'est conservé</span>
                      </div>
                    </div>
                  ) : (
                    <p className='text-center text-[10px] sm:text-[11px] md:text-xs text-slate-600'>
                      Sélectionnez une durée pour créer votre room sécurisée
                    </p>
                  )}
                </div>
              </div>

              {/* CTA */}
              <button
                onClick={() =>
                  ttl
                    ? createRoom(ttl)
                    : toast.info("Choisissez une durée d'abord.")
                }
                disabled={isPending}
                className='group relative w-full overflow-hidden rounded-xl border border-emerald-500/25 bg-emerald-500/10 py-4 sm:py-4.5 text-[11px] sm:text-[12px] md:text-[13px] font-bold uppercase tracking-[0.25em] sm:tracking-[0.3em] text-emerald-300 transition-all hover:bg-emerald-500/18 hover:border-emerald-500/40 active:scale-[0.98] disabled:opacity-40 cursor-pointer'
              >
                <span className='relative z-10'>
                  {isPending ? "Initialisation…" : "Créer la room"}
                </span>
                <div className='absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-emerald-500/5 to-transparent transition-transform duration-700 group-hover:translate-x-full' />
              </button>
            </div>
          </div>

          {/* ── Trust strip ── */}
          <div className='flex items-center justify-center gap-3 sm:gap-5 flex-wrap px-2'>
            {FEATURES.map((f, i) => (
              <Fragment key={f.label}>
                <span className='flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-[10px] md:text-[11px] uppercase tracking-wider text-slate-600'>
                  <Icon name={f.icon} />
                  {f.label}
                </span>
                {i < FEATURES.length - 1 && (
                  <span className='hidden sm:block h-3 w-px bg-slate-700/80' />
                )}
              </Fragment>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
