"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import useUsername from "@/hooks/use-username";
import { useMutation } from "@tanstack/react-query";
import { client } from "@/lib/client";
import { toast } from "react-toastify";
import Footer from "./Footer";

const Lobby = () => {
  const { username } = useUsername();
  const router = useRouter();
  const searchParams = useSearchParams();

  const wasDestroyed = searchParams.get("destroyed") === "true";
  const error = searchParams.get("error");

  const TTL_OPTIONS = [5, 15, 30];
  const [selectedTtlMinutes, setSelectedTtlMinutes] = useState<
    number | undefined
  >(undefined);

  const { mutate: createRoom, isPending } = useMutation({
    mutationFn: async (ttlMinutes: number) => {
      const res = await client.room.create.post(
        {},
        { query: { ttl: ttlMinutes.toString() } },
      );

      if (res.status === 200 && res.data?.roomId) {
        toast.success("Room éphémère créée !");
        // Le créateur va directement dans la room
        router.push(`/room/${res.data.roomId}`);
      } else {
        toast.error("Erreur lors de la création.");
      }
    },
  });

  const handleCreateRoom = () => {
    if (selectedTtlMinutes === undefined) {
      toast.info("Veuillez sélectionner une durée de vie.");
      return;
    }
    createRoom(selectedTtlMinutes);
  };

  return (
    <main className='flex min-h-dvh flex-col bg-[#09121a] text-slate-100 font-mono'>
      <div className='flex-1 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8'>
        {/* Adjusted Max Width: Slightly larger on desktop, not massive */}
        <div className='w-full max-w-md sm:max-w-lg md:max-w-xl space-y-8 md:space-y-10'>
          {/* GESTION VISUELLE DES ERREURS */}
          <div className='space-y-2'>
            {wasDestroyed && (
              <div className='p-3 border border-red-500/30 bg-red-500/10 text-red-400 text-[11px] md:text-[12px] text-center uppercase tracking-widest animate-pulse'>
                Discussion terminée : Room détruite
              </div>
            )}
            {error === "room-not-found" && (
              <div className='p-3 border border-orange-500/30 bg-orange-500/10 text-orange-400 text-[11px] md:text-[12px] text-center uppercase tracking-widest'>
                Accès refusé : Room inexistante
              </div>
            )}
            {error === "room-full" && (
              <div className='p-3 border border-yellow-500/30 bg-yellow-500/10 text-yellow-400 text-[11px] md:text-[12px] text-center uppercase tracking-widest'>
                Accès refusé : La room est complète
              </div>
            )}
          </div>

          <div className='text-center space-y-3 md:space-y-4'>
            {/* Title scales up just a bit to 5xl/6xl max */}
            <h1 className='text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter text-emerald-400 transition-all'>
              <span className='opacity-50 font-light mr-1 md:mr-2'>{">"}</span>
              TEMPORIS
            </h1>
            <p className='text-slate-500 text-[11px] md:text-[12px] uppercase tracking-[0.4em] leading-relaxed'>
              Rooms éphémères et chiffrées
            </p>
          </div>

          <div className='border border-slate-800 bg-[#0c1620] p-6 sm:p-8 md:p-10 shadow-2xl relative overflow-hidden group transition-all'>
            <div className='space-y-8 md:space-y-10 relative z-10'>
              <div className='space-y-4 md:space-y-5'>
                <label className='flex items-center justify-center text-center text-slate-500 text-[10px] md:text-[11px] uppercase tracking-[0.4em]'>
                  Durée de vie de la room
                </label>
                <div className='grid grid-cols-3 gap-3 md:gap-4'>
                  {TTL_OPTIONS.map((minutes) => (
                    <button
                      key={minutes}
                      onClick={() => setSelectedTtlMinutes(minutes)}
                      disabled={isPending}
                      className={`p-4 md:p-5 text-[11px] md:text-[12px] font-bold uppercase tracking-widest transition-all cursor-pointer border ${
                        minutes === selectedTtlMinutes
                          ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                          : "bg-slate-800/40 border-slate-700 text-slate-300 hover:border-emerald-500/30"
                      }`}
                    >
                      {minutes} min
                    </button>
                  ))}
                </div>
              </div>

              <div className='space-y-4 md:space-y-5'>
                <label className='flex items-center justify-center text-center text-slate-500 text-[10px] md:text-[11px] uppercase tracking-[0.4em]'>
                  Votre identité anonyme
                </label>
                <div className='bg-[#040506] border border-slate-800 p-5 md:p-6 text-base md:text-lg text-emerald-200/80 flex items-center justify-center transition-all'>
                  <div className='inline-flex items-center gap-4'>
                    <span className='truncate font-bold tracking-tight'>
                      {username}
                    </span>
                    <div className='h-2.5 w-2.5 md:h-3 md:w-3 bg-emerald-500 animate-pulse rounded-full shadow-[0_0_8px_rgba(16,185,129,0.6)]' />
                  </div>
                </div>
              </div>

              <button
                onClick={handleCreateRoom}
                disabled={isPending}
                className='w-full bg-emerald-500/10 border border-emerald-400/20 text-emerald-300 p-5 md:p-6 text-[12px] md:text-[13px] font-bold uppercase tracking-[0.3em] hover:bg-emerald-500/20 transition-all disabled:opacity-50 cursor-pointer active:scale-95'
              >
                {isPending ? "Initialisation..." : `Créer votre room éphémère`}
              </button>
            </div>
          </div>

          <div className='flex flex-col items-center gap-4 opacity-70'>
            <div className='h-px w-10 md:w-12 bg-slate-700' />
            <p className='text-[10px] md:text-[11px] uppercase tracking-[0.5em] text-white/80 font-medium'>
              Chiffrement de bout en bout
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
};

export default Lobby;
