import { formatCountdown } from "@/lib/countdown-format";

interface RoomHeaderProps {
  roomId: string;
  secondsRemaining: number | null;
  onCopyLink: () => void;
  onDestroy: () => void;
  isDestroying?: boolean;
}

const Countdown = ({ seconds, size }: { seconds: number | null; size: "sm" | "lg" }) => (
  <p
    className={`font-bold tabular-nums ${size === "sm" ? "text-2xl" : "text-3xl md:text-4xl"} ${
      seconds !== null && seconds < 60 ? "text-red-500 animate-pulse" : "text-emerald-400"
    }`}
  >
    {seconds !== null ? formatCountdown(seconds) : "--:--"}
  </p>
);

const RoomHeader = ({ roomId, secondsRemaining, onCopyLink, onDestroy, isDestroying }: RoomHeaderProps) => (
  <header className='border-b border-slate-700 p-4 md:p-5 lg:p-6 shrink-0 bg-[#0d1621]/95 backdrop-blur-md z-10'>
    <div className='mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 relative'>
      <div className='flex flex-col items-center md:hidden'>
        <p className='text-[12px] uppercase tracking-[0.4em] text-slate-500 mb-1'>Autodestruction</p>
        <Countdown seconds={secondsRemaining} size='sm' />
      </div>

      <div className='flex justify-center items-stretch gap-2 md:gap-3'>
        <button
          onClick={onCopyLink}
          className='relative group flex items-center gap-2 sm:gap-3 bg-slate-800/50 border border-slate-700 hover:border-emerald-500/50 px-3 py-2 md:px-4 md:py-3 rounded-xl transition-all active:scale-95 overflow-hidden cursor-pointer'
        >
          <div className='absolute inset-0 w-full h-full bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none' />
          <div className='flex flex-col items-start'>
            <span className='text-[8px] md:text-[9px] uppercase tracking-wider text-slate-500 leading-none mb-1 md:mb-1.5'>
              Session ID
            </span>
            <span className='text-[9px] min-[380px]:text-[10px] md:text-[11px] text-emerald-400 font-bold tracking-wider leading-none'>
              {roomId}
            </span>
          </div>
          <div className='h-full w-px bg-slate-700 mx-0.5 md:mx-1' />
          <span className='text-[8px] md:text-[9px] uppercase tracking-widest text-white/60 group-hover:text-emerald-400 transition-colors whitespace-nowrap'>
            Partager
          </span>
          <div className='h-1.5 w-1.5 md:h-2 md:w-2 bg-emerald-500 animate-pulse rounded-full ml-1 shadow-[0_0_8px_rgba(16,185,129,0.6)]' />
        </button>

        <button
          onClick={onDestroy}
          disabled={isDestroying}
          className='md:hidden flex items-center justify-center bg-red-500/10 border border-red-500/30 text-red-500 px-3 rounded-xl text-[10px] font-bold uppercase tracking-widest active:scale-95 disabled:opacity-40 cursor-pointer'
        >
          Détruire
        </button>
      </div>

      <div className='hidden md:flex flex-col items-center absolute left-1/2 -translate-x-1/2'>
        <p className='text-[10px] md:text-[11px] uppercase tracking-[0.4em] text-slate-500 mb-1'>
          Autodestruction
        </p>
        <Countdown seconds={secondsRemaining} size='lg' />
      </div>

      <div className='hidden md:block'>
        <button
          onClick={onDestroy}
          disabled={isDestroying}
          className='cursor-pointer rounded-xl bg-red-500/5 border border-red-500/20 px-6 py-3 md:px-8 md:py-3.5 text-[11px] md:text-[12px] font-bold uppercase tracking-[0.2em] text-red-500 transition-all hover:bg-red-500/20 active:scale-95 disabled:opacity-40'
        >
          Détruire
        </button>
      </div>
    </div>
  </header>
);

export default RoomHeader;