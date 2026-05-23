"use client";
import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import useUsername from "@/hooks/use-username";
import { useMutation } from "@tanstack/react-query";
import { client } from "@/lib/client";
import { toast } from "react-toastify";
import Footer from "./Footer";
import { Icon, IconName } from "./Icons";

// --- Constants & Config ---
const TTL_OPTIONS = [5, 15, 30] as const;

const TRUST_FEATURES: { icon: IconName; label: string }[] = [
  { icon: "lock", label: "Chiffrement (E2EE)" },
  { icon: "trash", label: "Aucune rétention" },
  { icon: "clock", label: "Auto-destruction" },
];

const Lobby = () => {
  const { username } = useUsername();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selectedTtl, setSelectedTtl] =
    useState<(typeof TTL_OPTIONS)[number]>();

  // --- Handlers & Mutations ---
  const { mutate: createRoom, isPending } = useMutation({
    mutationFn: async (ttlMinutes: number) => {
      const res = await client.room.create.post(
        {},
        { query: { ttl: String(ttlMinutes) } },
      );
      if (res.status === 200 && res.data?.roomId) {
        toast.success("Room éphémère créée !");
        router.push(`/room/${res.data.roomId}`);
      } else {
        toast.error("Erreur lors de la création.");
      }
    },
  });

  // --- UI State Logic ---
  const statusState = (() => {
    const error = searchParams.get("error");
    if (searchParams.get("destroyed") === "true")
      return {
        text: "Discussion terminée : Room détruite",
        textCls: "text-red-400 animate-pulse",
        dotCls: "bg-red-500 animate-pulse",
      };
    if (error === "room-not-found")
      return {
        text: "Accès refusé : Room inexistante",
        textCls: "text-orange-400",
        dotCls: "bg-orange-500",
      };
    if (error === "room-full")
      return {
        text: "Accès refusé : La room est complète",
        textCls: "text-yellow-400",
        dotCls: "bg-yellow-500",
      };
    return {
      text: "Chiffrement de bout en bout actif (E2EE)",
      textCls: "text-emerald-400/80",
      isSecure: true,
    };
  })();

  return (
    <main className="relative flex min-h-dvh flex-col bg-[#0d1621] text-slate-100 font-sans overflow-hidden selection:bg-emerald-500/20">
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[55%] h-[55%] bg-emerald-500/5 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[55%] h-[55%] bg-emerald-600/5 rounded-full blur-[140px]" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-4 sm:p-5 md:p-8">
        <div className="w-full max-w-md sm:max-w-lg md:max-w-xl space-y-7 md:space-y-10">
          <div className="text-center space-y-3 md:space-y-4">
            <div className="inline-flex items-center justify-center gap-2 px-4 py-1.5 md:py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] md:text-xs font-medium text-emerald-400 mb-1.5 md:mb-2">
              <Icon name="shield" />
              <span>Chiffrement de bout en bout</span>
            </div>
            <h1 className="text-[42px] sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white">
              <span className="text-emerald-400">{">"}</span>Tempor
              <span className="text-emerald-400">is</span>
            </h1>
            <p className="text-slate-500 text-[11px] md:text-[12px] uppercase tracking-[0.4em] leading-relaxed">
              Rooms éphémères et chiffrées
            </p>
          </div>

          <div className="bg-[#0d1621]/80 backdrop-blur-xl border border-slate-700/60 rounded-2xl shadow-2xl shadow-black/40 overflow-hidden">
            <div className="border-b border-slate-700/60 bg-[#0a1118]/60 px-5 py-3.5 md:px-6 md:py-4 text-center">
              <div
                className={`flex items-center justify-center gap-2 text-[11px] md:text-[12px] uppercase tracking-widest ${statusState.textCls}`}
              >
                {statusState.isSecure ? (
                  <span className="hidden sm:flex">
                    <Icon name="lock" />
                  </span>
                ) : (
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusState.dotCls}`}
                  />
                )}
                {statusState.text}
              </div>
            </div>

            <div className="p-6 sm:p-8 md:p-12 space-y-7 md:space-y-10">
              <div className="space-y-3.5 md:space-y-5">
                <label className="flex items-center justify-center text-center text-slate-500 text-[10px] md:text-[11px] uppercase tracking-[0.4em]">
                  <Icon name="user" className="w-3.5 h-3.5 mr-2" />
                  Votre identité anonyme
                </label>
                <div className="bg-[#0a1118] border border-slate-700 p-4 sm:p-5 md:p-6 text-base md:text-lg text-emerald-200/80 flex items-center justify-center transition-all rounded-xl">
                  <div className="inline-flex items-center gap-3.5 md:gap-4">
                    <span className="truncate font-bold tracking-tight font-mono">
                      {username}
                    </span>
                    <div className="h-2.5 w-2.5 md:h-3 md:w-3 bg-emerald-500 animate-pulse rounded-full shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                  </div>
                </div>
              </div>

              <div className="space-y-3.5 md:space-y-5">
                <label className="flex items-center justify-center text-center text-slate-500 text-[10px] md:text-[11px] uppercase tracking-[0.4em]">
                  <Icon name="clock" />
                  <span className="ml-2">Durée de vie de la room</span>
                </label>

                <div className="grid grid-cols-3 gap-2.5 sm:gap-3 md:gap-4">
                  {TTL_OPTIONS.map((minutes) => {
                    const isSelected = minutes === selectedTtl;
                    return (
                      <button
                        key={minutes}
                        onClick={() => setSelectedTtl(minutes)}
                        disabled={isPending}
                        className={`relative overflow-hidden rounded-xl p-3.5 sm:p-4 md:p-5 text-center transition-all duration-200 border cursor-pointer ${
                          isSelected
                            ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                            : "bg-slate-800/40 border-slate-600 text-slate-300 hover:border-emerald-500/30"
                        }`}
                      >
                        <span className="flex flex-col md:flex-row justify-center items-center text-xl md:text-2xl font-bold leading-none uppercase tracking-wider">
                          {minutes}
                          <span
                            className={`text-[10px] md:ml-1 md:text-[11px] mt-1.5 md:mt-2 font-medium uppercase tracking-widest ${isSelected ? "text-emerald-500/70" : "text-slate-600"}`}
                          >
                            min
                          </span>
                        </span>
                        {isSelected && (
                          <div className="absolute inset-0 bg-linear-to-tr from-emerald-500/10 to-transparent pointer-events-none" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={() =>
                  selectedTtl
                    ? createRoom(selectedTtl)
                    : toast.info("Veuillez sélectionner une durée de vie.")
                }
                disabled={isPending}
                className="w-full bg-emerald-500/10 border border-emerald-400/20 text-emerald-300 p-4 sm:p-5 md:p-6 text-[11px] sm:text-[12px] md:text-[13px] font-bold uppercase tracking-[0.25em] md:tracking-[0.3em] hover:bg-emerald-500/20 transition-all disabled:opacity-50 cursor-pointer active:scale-95 rounded-xl shadow-lg shadow-emerald-900/20"
              >
                {isPending ? "Initialisation..." : "Créer votre room éphémère"}
              </button>
            </div>
          </div>

          <div className="flex flex-col items-center gap-3 md:gap-4 opacity-70">
            <div className="flex items-center gap-3 sm:gap-6 flex-wrap justify-center">
              {TRUST_FEATURES.map((feature, idx) => (
                <React.Fragment key={idx}>
                  <div className="flex items-center gap-1.5 text-[10px] md:text-[11px] text-slate-500 uppercase tracking-wider">
                    <Icon name={feature.icon} />
                    {feature.label}
                  </div>
                  {idx < TRUST_FEATURES.length - 1 && (
                    <div className="w-px h-3 bg-slate-700 hidden sm:block" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
};

export default Lobby;