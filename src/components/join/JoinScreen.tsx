"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/Icons";
import BrandMark from "@/components/common/BrandMark";

interface JoinScreenProps {
  username: string;
  roomId: string;
  onRegenerateUsername?: () => void;
  onJoin: () => void;
  onDecline: () => void;
}

const JoinScreen = ({
  username,
  roomId,
  onRegenerateUsername,
  onJoin,
  onDecline,
}: JoinScreenProps) => {
  const t = useTranslations("Join");
  const tCommon = useTranslations("Common");
  const tLobby = useTranslations("Lobby");
  const [isRegenerating, setIsRegenerating] = useState(false);

  const handleRegenerate = () => {
    if (!onRegenerateUsername) return;
    setIsRegenerating(true);
    onRegenerateUsername();
    setTimeout(() => setIsRegenerating(false), 300);
  };

  return (
    <div className='flex flex-col w-full font-mono gap-3 sm:gap-6'>
      {/* Brand Header with invitation badge */}
      <BrandMark
        badge={
          <div className='relative inline-flex items-center gap-2 text-[10px] sm:text-[11px] uppercase tracking-[0.25em] text-emerald-400 font-semibold px-3.5 py-1.5 rounded-none border border-emerald-500/30 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.15)]'>
            {/* 4 crisp tactical cyber corners */}
            <div className='absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-emerald-400 pointer-events-none' />
            <div className='absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-emerald-400 pointer-events-none' />
            <div className='absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l border-emerald-400 pointer-events-none' />
            <div className='absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-emerald-400 pointer-events-none' />

            <Icon name='shield' className='h-3.5 w-3.5 text-emerald-400' />
            <span className='text-emerald-300 font-bold'>{t("invitationBadge")}</span>
          </div>
        }
      />

      {/* Cyberpunk Card matching Lobby exactly */}
      <div className='border border-emerald-500/25 bg-[#0c1522]/90 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] relative rounded-none overflow-hidden flex flex-col'>
        {/* Tactical Corner Accents */}
        <div className='absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-emerald-400/80 z-10' />
        <div className='absolute top-0 right-0 w-2.5 h-2.5 border-t border-r border-emerald-400/80 z-10' />
        <div className='absolute bottom-0 left-0 w-2.5 h-2.5 border-b border-l border-emerald-400/80 z-10' />
        <div className='absolute bottom-0 right-0 w-2.5 h-2.5 border-b border-r border-emerald-400/80 z-10' />

        {/* Anonymous Identity Header */}
        <div className='flex items-center justify-between border-b border-emerald-500/20 bg-emerald-950/20 px-4 py-3 sm:py-4 sm:px-6'>
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

          {onRegenerateUsername && (
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
          )}
        </div>

        {/* Content Area */}
        <div className='p-4 sm:p-8 flex flex-col gap-4 sm:gap-7'>
          {/* Main Encadré: cleanly wraps info on top and details at bottom */}
          <div className='flex flex-col rounded-none border border-emerald-500/20 bg-emerald-950/15 p-3.5 sm:p-0 sm:border-0 sm:bg-transparent gap-4 sm:gap-7'>
            {/* Info Container: single unified container on desktop, matching encadré on mobile */}
            <div className='rounded-none sm:border sm:border-emerald-500/20 sm:bg-emerald-950/15 sm:p-4 space-y-2.5 sm:space-y-3.5'>
              {/* Invitation / secure channel banner */}
              <div className='flex items-center gap-3'>
                <div className='flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-none bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'>
                  <Icon name='lock' className='h-3.5 w-3.5 sm:h-4 sm:w-4' />
                </div>
                <div className='text-xs text-slate-300 leading-snug flex items-center'>
                  {t("invitedSubtitle")}
                </div>
              </div>

              {/* Divider on desktop */}
              <div className='hidden sm:block h-px w-full bg-emerald-500/15' />

              {/* Red trash icon with 'Aucun historique n'est conservé' */}
              <div className='flex items-center gap-3'>
                <div className='flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-none bg-red-500/10 text-red-400 border border-red-500/20'>
                  <Icon name='trash' className='h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-400' />
                </div>
                <div className='text-xs text-slate-300 leading-snug flex items-center'>
                  {tLobby("roomInfoNoHistory")}
                </div>
              </div>
            </div>

            {/* Session Room ID Box: cleanly placed under the info box */}
            <div className='space-y-2.5 sm:space-y-3'>
              <div className='flex items-center justify-between text-xs'>
                <span className='text-[10px] sm:text-[11px] uppercase tracking-wider font-bold text-slate-300'>
                  {t("sessionLabel")}
                </span>
                <span className='text-[10px] sm:text-[11px] text-emerald-400/90 font-semibold tracking-wider font-mono'>
                  CANAL SÉCURISÉ
                </span>
              </div>

              <div className='flex items-center justify-between px-4 py-3.5 rounded-none border border-emerald-500/30 bg-[#0a1420] text-emerald-200'>
                <span className='font-mono text-xs sm:text-sm font-bold tracking-widest truncate'>
                  {roomId}
                </span>
                <span className='h-2 w-2 rounded-none bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse' />
              </div>
            </div>
          </div>

          {/* Desktop Action Buttons: Join and Decline */}
          <div className='hidden sm:flex gap-3 pt-2'>
            <button
              type='button'
              onClick={onDecline}
              className='py-3.5 px-5 rounded-none border border-slate-700/80 bg-[#0c1622] hover:bg-[#111e2e] text-slate-300 hover:text-white transition-all text-xs font-bold uppercase tracking-wider cursor-pointer'
            >
              {t("backHome")}
            </button>
            <button
              type='button'
              onClick={onJoin}
              className='flex-1 flex items-center justify-center gap-2.5 rounded-none border border-emerald-500/60 bg-emerald-600/25 hover:bg-emerald-500/35 hover:border-emerald-400 text-emerald-100 py-3.5 text-xs md:text-sm font-bold uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(16,185,129,0.18)] transition-all active:scale-[0.99] cursor-pointer'
            >
              <span>{t("joinRoom")}</span>
              <Icon
                name='arrowRight'
                className='h-4 w-4 text-emerald-300 stroke-[2.5]'
              />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Fixed Bottom Action Buttons */}
      <div className='sm:hidden fixed bottom-0 left-0 right-0 z-[60] p-4 bg-[#0a121d]/95 border-t border-emerald-500/25 backdrop-blur-2xl shadow-[0_-10px_30px_rgba(0,0,0,0.8)] pointer-events-auto'>
        <div className='max-w-md mx-auto flex gap-2.5'>
          <button
            type='button'
            onClick={onDecline}
            className='py-3.5 px-4 rounded-none border border-slate-700 bg-[#0c1622] text-slate-300 text-xs font-bold uppercase tracking-wider cursor-pointer touch-manipulation select-none'
          >
            {t("backHome")}
          </button>
          <button
            type='button'
            onClick={onJoin}
            className='flex-1 flex items-center justify-center gap-2 rounded-none border border-emerald-500/60 bg-emerald-600/30 active:bg-emerald-500/40 text-emerald-100 py-3.5 font-bold uppercase tracking-widest text-xs shadow-[0_0_20px_rgba(16,185,129,0.2)] cursor-pointer touch-manipulation select-none'
          >
            <span>{t("joinRoom")}</span>
            <Icon
              name='arrowRight'
              className='h-4 w-4 text-emerald-300 stroke-[2.5]'
            />
          </button>
        </div>
      </div>
    </div>
  );
};

export default JoinScreen;