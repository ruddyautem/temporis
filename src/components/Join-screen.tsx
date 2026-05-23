"use client";

import Footer from "./Footer";

const LockIcon = () => (
  <svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
    <path strokeLinecap='round' strokeLinejoin='round' d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' />
  </svg>
);
const TrashIcon = () => (
  <svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
    <path strokeLinecap='round' strokeLinejoin='round' d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' />
  </svg>
);
const ClockIcon = () => (
  <svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
    <path strokeLinecap='round' strokeLinejoin='round' d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' />
  </svg>
);

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
    <main className='relative flex min-h-dvh flex-col bg-[#0d1621] text-slate-100 font-sans overflow-hidden selection:bg-emerald-500/20'>
      
      {/* Background Ambience */}
      <div className='absolute inset-0 z-0 overflow-hidden pointer-events-none'>
        <div className='absolute top-[-20%] left-[-10%] w-[55%] h-[55%] bg-emerald-500/5 rounded-full blur-[140px]' />
        <div className='absolute bottom-[-20%] right-[-10%] w-[55%] h-[55%] bg-emerald-600/5 rounded-full blur-[140px]' />
      </div>

      <div className='relative z-10 flex-1 flex flex-col items-center justify-center p-4 sm:p-5 md:p-8'>
        <div className='w-full max-w-md sm:max-w-lg md:max-w-xl space-y-7 md:space-y-10'>
          
          {/* Header - Same as Lobby */}
          <div className='text-center space-y-3 md:space-y-4'>
            <div className='inline-flex items-center justify-center gap-2 px-4 py-1.5 md:py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] md:text-xs font-medium text-emerald-400 mb-1.5 md:mb-2'>
              <svg className='w-3.5 h-3.5 md:w-4 md:h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
                <path strokeLinecap='round' strokeLinejoin='round' d='M13 10V3L4 14h7v7l9-11h-7z' />
              </svg>
              <span>Invitation Reçue</span>
            </div>
            <h1 className='text-[42px] sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white'>
              <span className='text-emerald-400'> {'>'}</span>Tempor<span className='text-emerald-400'>is</span>
            </h1>
            <p className='text-slate-500 text-[11px] md:text-[12px] uppercase tracking-[0.4em] leading-relaxed'>
              Rooms éphémères et chiffrées
            </p>
          </div>

          {/* Main Card - Same structure as Lobby */}
          <div className='bg-[#0d1621]/80 backdrop-blur-xl border border-slate-700/60 rounded-2xl shadow-2xl shadow-black/40 overflow-hidden'>
            
            {/* Status Banner - Shows invitation message */}
            <div className='border-b border-slate-700/60 bg-[#0a1118]/60 px-5 py-3.5 md:px-6 md:py-4 text-center'>
              <div className='flex items-center justify-center gap-2 text-emerald-400/80 text-[11px] md:text-[12px] uppercase tracking-widest'>
                <svg className='w-3.5 h-3.5' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
                  <path strokeLinecap='round' strokeLinejoin='round' d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' />
                </svg>
                Vous avez été invité à rejoindre cette conversation
              </div>
            </div>

            <div className='p-6 sm:p-8 md:p-12 space-y-7 md:space-y-10'>
              
              {/* Identité */}
              <div className='space-y-3.5 md:space-y-5'>
                <label className='flex items-center justify-center text-center text-slate-500 text-[10px] md:text-[11px] uppercase tracking-[0.4em]'>
                  <svg className='w-3.5 h-3.5 mr-2' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
                    <path strokeLinecap='round' strokeLinejoin='round' d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' />
                  </svg>
                  Votre identité anonyme
                </label>
                <div className='bg-[#0a1118] border border-slate-700 p-4 sm:p-5 md:p-6 flex items-center justify-center transition-all rounded-xl'>
                  <div className='inline-flex items-center gap-3.5 md:gap-4 text-base md:text-lg text-emerald-200/80'>
                    <span className='truncate font-bold tracking-tight font-mono'>
                      {username}
                    </span>
                    <div className='h-2.5 w-2.5 md:h-3 md:w-3 bg-emerald-500 animate-pulse rounded-full shadow-[0_0_8px_rgba(16,185,129,0.6)]' />
                  </div>
                </div>
                
                {/* Session ID - Small centered text under the container */}
                <p className='text-center text-[9px] md:text-[10px] text-slate-500 uppercase tracking-widest'>
                  Session <span className='text-emerald-400/80 font-mono'>{roomId}</span>
                </p>
              </div>

              {/* Action Buttons (Maintenant côte à côte sur tous les écrans) */}
              <div className='flex flex-row gap-2 sm:gap-4 pt-2'>
                <button
                  onClick={onJoin}
                  className='flex-1 flex items-center justify-center text-center bg-emerald-500/10 border border-emerald-400/20 text-emerald-300 p-3 sm:p-5 md:p-6 text-[12px] md:text-[13px] font-bold uppercase tracking-widest sm:tracking-[0.25em] md:tracking-[0.3em] hover:bg-emerald-500/20 transition-all cursor-pointer active:scale-95 rounded-xl shadow-lg shadow-emerald-900/20 leading-snug'
                >
                  Rejoindre<br className="sm:hidden" /> Room
                </button>
                <button
                  onClick={onDecline}
                  className='flex-1 flex items-center justify-center text-center bg-red-500/5 border border-red-500/20 text-red-400/80 p-3 sm:p-5 md:p-6 text-[12px] md:text-[13px] font-bold uppercase tracking-widest sm:tracking-[0.25em] md:tracking-[0.3em] hover:bg-red-500/10 hover:text-red-400 transition-all cursor-pointer active:scale-95 rounded-xl shadow-lg shadow-red-900/10 leading-snug'
                >
                  Retour<br className="sm:hidden" /> Accueil
                </button>
              </div>
            </div>
          </div>

          {/* Barre de confiance - Same as Lobby */}
          <div className='flex flex-col items-center gap-3 md:gap-4 opacity-70'>
            <div className='flex items-center gap-3 sm:gap-6 flex-wrap justify-center'>
              <div className='flex items-center gap-1.5 text-[10px] md:text-[11px] text-slate-500 uppercase tracking-wider'>
                <LockIcon />
                Chiffrement (E2EE)
              </div>
              <div className='w-px h-3 bg-slate-700 hidden sm:block' />
              <div className='flex items-center gap-1.5 text-[10px] md:text-[11px] text-slate-500 uppercase tracking-wider'>
                <TrashIcon />
                Aucune rétention
              </div>
              <div className='w-px h-3 bg-slate-700 hidden sm:block' />
              <div className='flex items-center gap-1.5 text-[10px] md:text-[11px] text-slate-500 uppercase tracking-wider'>
                <ClockIcon />
                Auto-destruction
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
};

export default JoinScreen;