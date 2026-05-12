"use client";

import Footer from "@/components/Footer";

interface JoinScreenProps {
  username: string;
  roomId: string;
  onJoin: () => void;
  onDecline: () => void;
}

const JoinScreen = ({
  username,
  roomId,
  onJoin,
  onDecline,
}: JoinScreenProps) => {
  return (
    <main className='flex min-h-dvh flex-col bg-[#09121a] text-slate-100 font-mono'>
      <div className='flex-1 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8'>
        {/* Modest Max Width matching the Lobby */}
        <div className='w-full max-w-md sm:max-w-lg md:max-w-xl space-y-8 md:space-y-10'>
          <div className='text-center space-y-3 md:space-y-4'>
            <h1 className='text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter text-emerald-400 transition-all'>
              <span className='opacity-50 font-light mr-1 md:mr-2'>{">"}</span>
              TEMPORIS
            </h1>
            <p className='text-slate-500 text-[11px] md:text-[12px] uppercase tracking-[0.4em] leading-relaxed'>
              Rooms éphémères et chiffrées
            </p>
          </div>

          <div className='border border-slate-800 bg-[#0c1620] p-6 sm:p-8 md:p-10 shadow-2xl relative overflow-hidden group space-y-8 md:space-y-10 transition-all'>
            <div className='text-center space-y-3 md:space-y-4 border-b border-slate-800/50 pb-6 md:pb-8'>
              <p className='text-[12px] md:text-[13px] text-slate-300 leading-relaxed uppercase tracking-widest font-medium'>
                Vous avez été invité à rejoindre cette conversation.
              </p>
              <div className='inline-block bg-slate-900/50 border border-slate-800 px-3 py-1.5 md:px-4 md:py-2 rounded mt-2'>
                <p className='text-[9px] md:text-[10px] text-slate-500 uppercase tracking-widest flex items-center gap-2'>
                  Session <span className='text-emerald-400'>{roomId}</span>
                </p>
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

            <div className='flex flex-col sm:flex-row gap-3 md:gap-4 pt-2'>
              <button
                onClick={onJoin}
                className='flex-1 bg-emerald-500/10 border border-emerald-400/20 text-emerald-300 p-4 md:p-5 text-[11px] md:text-[12px] font-bold uppercase tracking-[0.2em] hover:bg-emerald-500/20 transition-all cursor-pointer active:scale-95'
              >
                Oui, Rejoindre
              </button>
              <button
                onClick={onDecline}
                className='flex-1 bg-red-500/5 border border-red-500/20 text-red-400/80 p-4 md:p-5 text-[11px] md:text-[12px] font-bold uppercase tracking-[0.2em] hover:bg-red-500/10 hover:text-red-400 transition-all cursor-pointer active:scale-95'
              >
                Non, Retour
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

export default JoinScreen;
