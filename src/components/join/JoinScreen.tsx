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
    <div className='flex flex-col flex-1 sm:flex-initial w-full font-mono gap-3 sm:gap-6 min-h-0 sm:min-h-fit'>
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

          {onRegenerateUsername && (
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
          )}
        </div>

        {/* ========================================================================= */}
        {/* MOBILE CONTENT AREA (sm:hidden) - STRICTLY KEPT INTACT AS APPROVED        */}
        {/* ========================================================================= */}
        <div className='sm:hidden p-4 flex flex-col flex-1 justify-between gap-4 min-h-0 overflow-y-auto'>
          <div className='flex flex-col flex-1 justify-between rounded-none border border-emerald-500/20 bg-emerald-950/15 p-3.5 gap-4'>
            {/* Info specifications */}
            <div className='space-y-3'>
              <div className='flex items-start gap-3'>
                <div className='flex h-7 w-7 shrink-0 items-center justify-center rounded-none bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mt-0.5'>
                  <Icon name='lock' className='h-3.5 w-3.5' />
                </div>
                <div className='text-xs text-slate-300 leading-snug'>
                  <span>{t("invitedSubtitle")}</span>
                </div>
              </div>

              <div className='flex items-start gap-3'>
                <div className='flex h-7 w-7 shrink-0 items-center justify-center rounded-none bg-red-500/10 text-red-400 border border-red-500/20 mt-0.5'>
                  <Icon name='trash' className='h-3.5 w-3.5 text-red-400' />
                </div>
                <div className='text-xs text-slate-300 leading-snug'>
                  <span>{tLobby("roomInfoNoHistory")}</span>
                </div>
              </div>
            </div>

            {/* Session ID */}
            <div className='space-y-2'>
              <div className='flex items-center justify-between text-xs'>
                <span className='text-[10px] uppercase tracking-wider font-bold text-slate-300'>
                  {t("sessionLabel")}
                </span>
                <span className='text-[10px] text-emerald-400/90 font-semibold tracking-wider font-mono'>
                  ROOM SÉCURISÉE
                </span>
              </div>

              <div className='flex items-center justify-between px-4 py-3 rounded-none border border-emerald-500/30 bg-[#0a1420] text-emerald-200'>
                <span className='font-mono text-xs font-bold tracking-widest truncate'>
                  {roomId}
                </span>
                <span className='h-2 w-2 rounded-none bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse' />
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
            {/* Card 1: Channel Security */}
            <div className='lobby-top-card relative p-3 md:p-4 lg:p-3.5 2xl:p-6 border border-emerald-500/20 bg-[#09111c]/80 group hover:border-emerald-400/40 transition-all'>
              <div className='absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-emerald-400' />
              <div className='flex items-center gap-2.5 md:gap-3 2xl:gap-4 mb-1 md:mb-2 2xl:mb-3'>
                <div className='flex h-7 w-7 md:h-8 md:w-8 2xl:h-10 2xl:w-10 shrink-0 items-center justify-center bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'>
                  <Icon name='shield' className='h-3.5 w-3.5 md:h-4 md:w-4 2xl:h-5 2xl:w-5' />
                </div>
                <div>
                  <div className='text-[9px] md:text-[9.5px] 2xl:text-xs uppercase font-bold tracking-widest text-emerald-400/80'>{t("cardSecurityTitle")}</div>
                  <div className='text-[11px] md:text-xs 2xl:text-sm font-bold text-slate-100 uppercase tracking-wider'>{t("cardSecurityBadge")}</div>
                </div>
              </div>
              <p className='text-[10px] md:text-[11px] 2xl:text-xs text-slate-300/90 leading-snug 2xl:leading-relaxed'>
                {t("cardSecurityDesc")}
              </p>
            </div>

            {/* Card 2: Ephemeral Lifetime */}
            <div className='lobby-top-card relative p-3 md:p-4 lg:p-3.5 2xl:p-6 border border-emerald-500/20 bg-[#09111c]/80 group hover:border-emerald-400/40 transition-all'>
              <div className='absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-emerald-400' />
              <div className='flex items-center gap-2.5 md:gap-3 2xl:gap-4 mb-1 md:mb-2 2xl:mb-3'>
                <div className='flex h-7 w-7 md:h-8 md:w-8 2xl:h-10 2xl:w-10 shrink-0 items-center justify-center bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'>
                  <Icon name='clock' className='h-3.5 w-3.5 md:h-4 md:w-4 2xl:h-5 2xl:w-5' />
                </div>
                <div>
                  <div className='text-[9px] md:text-[9.5px] 2xl:text-xs uppercase font-bold tracking-widest text-emerald-400/80'>{t("cardLifeTitle")}</div>
                  <div className='text-[11px] md:text-xs 2xl:text-sm font-bold text-emerald-300 uppercase tracking-wider'>{t("cardLifeBadge")}</div>
                </div>
              </div>
              <p className='text-[10px] md:text-[11px] 2xl:text-xs text-slate-300/90 leading-snug 2xl:leading-relaxed'>
                {t("cardLifeDesc")}
              </p>
            </div>

            {/* Card 3: Zero Trace */}
            <div className='lobby-top-card relative p-3 md:p-4 lg:p-3.5 2xl:p-6 border border-emerald-500/20 bg-[#09111c]/80 group hover:border-emerald-400/40 transition-all'>
              <div className='absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-emerald-400' />
              <div className='flex items-center gap-2.5 md:gap-3 2xl:gap-4 mb-1 md:mb-2 2xl:mb-3'>
                <div className='flex h-7 w-7 md:h-8 md:w-8 2xl:h-10 2xl:w-10 shrink-0 items-center justify-center bg-red-500/10 border border-red-500/20 text-red-400'>
                  <Icon name='trash' className='h-3.5 w-3.5 md:h-4 md:w-4 2xl:h-5 2xl:w-5 text-red-400' />
                </div>
                <div>
                  <div className='text-[9px] md:text-[9.5px] 2xl:text-xs uppercase font-bold tracking-widest text-red-400/80'>{t("cardTraceTitle")}</div>
                  <div className='text-[11px] md:text-xs 2xl:text-sm font-bold text-slate-100 uppercase tracking-wider'>{t("cardTraceBadge")}</div>
                </div>
              </div>
              <p className='text-[10px] md:text-[11px] 2xl:text-xs text-slate-300/90 leading-snug 2xl:leading-relaxed'>
                {t("cardTraceDesc")}
              </p>
            </div>
          </div>

          {/* Central Join Station */}
          <div className='lobby-configurator relative border border-emerald-500/25 bg-emerald-950/15 p-4 md:p-6 lg:p-5 2xl:p-8 space-y-4 md:space-y-5 2xl:space-y-6'>
            <div className='flex items-center justify-between border-b border-emerald-500/20 pb-2.5 md:pb-3.5 2xl:pb-4'>
              <div>
                <div className='flex items-center gap-2'>
                  <span className='h-2 w-2 shrink-0 bg-emerald-400' />
                  <h3 className='text-xs md:text-sm 2xl:text-base font-bold uppercase tracking-[0.2em] text-emerald-400'>
                    {t("settingsTitle")}
                  </h3>
                </div>
                <p className='text-[9px] md:text-[9.5px] 2xl:text-xs uppercase tracking-widest text-slate-400 mt-1 pl-4'>
                  {t("invitedSubtitle")}
                </p>
              </div>

              <div className='flex items-center gap-2 px-3 py-1 md:py-1.5 2xl:px-4 2xl:py-2 border border-emerald-500/25 bg-[#070e17] text-emerald-300 text-[10.5px] 2xl:text-xs font-mono font-bold tracking-wider'>
                <span className='w-1.5 h-1.5 bg-emerald-400' />
                {t("unlockedBadge")}
              </div>
            </div>

            {/* Large Room ID Display Banner */}
            <div className='p-3.5 md:p-4 2xl:p-6 border border-emerald-500/25 bg-[#09111c] flex items-center justify-between'>
              <div className='space-y-1'>
                <div className='text-[9px] 2xl:text-xs uppercase font-bold tracking-widest text-emerald-400/80'>
                  {t("roomIdentifier")}
                </div>
                <div className='text-base md:text-lg 2xl:text-2xl font-black font-mono tracking-[0.2em] text-white flex items-center gap-3'>
                  <span>{roomId}</span>
                </div>
              </div>

              <div className='flex items-center gap-2 px-3 py-1.5 2xl:px-4 2xl:py-2 border border-emerald-500/20 bg-emerald-950/40 text-emerald-300 text-[11px] 2xl:text-xs font-mono font-bold'>
                <Icon name='lock' className='h-3.5 w-3.5 2xl:h-4 2xl:w-4 text-emerald-400' />
                <span>{t("accessReady")}</span>
              </div>
            </div>

            {/* Actions Bar */}
            <div className='pt-2.5 md:pt-3.5 2xl:pt-4 border-t border-emerald-500/20 flex items-center justify-between gap-4 2xl:gap-6'>
              <button
                type='button'
                onClick={onDecline}
                className='lobby-cta-btn py-2.5 md:py-3.5 2xl:py-4 px-5 2xl:px-8 rounded-none border border-slate-700 bg-[#0c1622] hover:bg-[#111e2e] text-slate-300 hover:text-white transition-all text-xs 2xl:text-sm font-bold uppercase tracking-[0.15em] cursor-pointer'
              >
                {t("backHome")}
              </button>

              <button
                type='button'
                onClick={onJoin}
                className='lobby-cta-btn flex-1 max-w-sm 2xl:max-w-md flex items-center justify-center gap-3 rounded-none border border-emerald-400 bg-emerald-600/25 hover:bg-emerald-500/35 active:bg-emerald-500/40 text-emerald-100 hover:text-white py-2.5 md:py-3.5 2xl:py-4 px-5 2xl:px-8 text-xs lg:text-sm 2xl:text-base font-bold uppercase tracking-[0.2em] transition-all active:scale-[0.99] cursor-pointer'
              >
                <span>{t("joinRoom")}</span>
                <Icon
                  name='arrowRight'
                  className='h-4 w-4 2xl:h-5 2xl:w-5 text-emerald-300 stroke-[2.5]'
                />
              </button>
            </div>
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