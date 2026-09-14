"use client";

import { forwardRef, useState, useEffect } from "react";
import { format } from "date-fns";
import { useTranslations } from "next-intl";
import { formatCountdown } from "@/lib/countdown-format";
import type { ChatMessage } from "@/types/chat";

interface ChatPanelProps {
  isLoading: boolean;
  messages: ChatMessage[];
  currentUsername: string | undefined;
  scrollAnchorRef: React.RefObject<HTMLDivElement | null>;
  hasNewMessage: boolean;
  onJumpToBottom: () => void;
  secondsRemaining: number | null;
  initialSeconds: number | null;
  children?: React.ReactNode;
}

const MessageBubble = ({ msg, isOwn, youLabel }: { msg: ChatMessage; isOwn: boolean; youLabel: string }) => {
  if (msg.sender === "SYSTEM") {
    return (
      <div className='flex items-center justify-center my-2 sm:my-3'>
        <div className='flex items-center gap-2 px-3 py-1 bg-[#0a1520]/80 border border-slate-700/60 shadow-sm'>
          <span className='inline-block w-1.5 h-1.5 bg-emerald-400/80 animate-pulse' />
          <span className='text-[10px] md:text-[11px] uppercase tracking-wider text-slate-300 font-semibold'>
            {msg.clearText}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className='flex justify-start w-full py-1'>
      <div className='w-full max-w-[96%] sm:max-w-[88%] md:max-w-[82%]'>
        {/* Header: Colored accent bar + Pseudo + (vous) + Heure */}
        <div className='mb-1 flex items-center gap-2 select-none'>
          {/* Petite barre colorée d'identification */}
          <span
            className={`w-1 h-3 shrink-0 ${
              isOwn ? "bg-emerald-400" : "bg-sky-400"
            }`}
          />
          <div className='flex items-center gap-1.5 min-w-0'>
            <span
              className={`text-[11px] md:text-[12px] font-bold uppercase tracking-wider truncate ${
                isOwn ? "text-emerald-400" : "text-sky-400"
              }`}
            >
              {msg.sender}
            </span>
            {isOwn && (
              <span className='px-1.5 py-0.2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-semibold uppercase tracking-wider'>
                {youLabel}
              </span>
            )}
          </div>
          <span className='text-slate-500 font-mono text-[9px] md:text-[10px] ml-1'>
            {format(msg.timestamp, "HH:mm")}
          </span>
        </div>

        {/* Message text with slight indent aligning with text */}
        <p className='pl-3 whitespace-pre-wrap break-words text-[13px] md:text-[14px] text-slate-100 leading-relaxed font-mono selection:bg-emerald-500/30'>
          {msg.clearText}
        </p>
      </div>
    </div>
  );
};

const ChatPanel = forwardRef<HTMLDivElement, ChatPanelProps>(
  (
    {
      isLoading,
      messages,
      currentUsername,
      scrollAnchorRef,
      hasNewMessage,
      onJumpToBottom,
      secondsRemaining,
      initialSeconds,
      children,
    },
    containerRef,
  ) => {
    const t = useTranslations("Room");

    // Telemetry ratio & calculations
    const total = initialSeconds && initialSeconds > 0 ? initialSeconds : 900;
    const current = secondsRemaining !== null ? secondsRemaining : total;
    const ratio = Math.max(0, Math.min(1, current / total));
    const percent = Math.round(ratio * 100);

    // Dynamic thresholds proportional to total chosen TTL:
    // - Danger / Imminent (Red): last 10% of total time
    // - Warning / Expiration soon (Yellow/Orange): last 25% of total time
    const dangerThreshold = Math.round(total * 0.10);
    const warningThreshold = Math.round(total * 0.25);

    const isUrgent = secondsRemaining !== null && secondsRemaining <= dangerThreshold;
    const isWarning = secondsRemaining !== null && !isUrgent && secondsRemaining <= warningThreshold;

    // Intelligent contextual status feedback with exact time
    const timeFormatted = secondsRemaining !== null ? formatCountdown(secondsRemaining) : "--:--";

    // Dynamic state theme color matching:
    // Urgent: Red alert
    // Warning: Amber
    // Nominal: Emerald
    const stateTheme = (() => {
      if (isUrgent) {
        return {
          type: "danger",
          pingClass: "bg-red-400",
          dotClass: "bg-red-500",
          textClass: "text-red-400 font-bold animate-pulse",
          barColor: "bg-gradient-to-r from-red-600 via-rose-500 to-red-400",
          barShadow: "shadow-[0_0_12px_rgba(239,68,68,0.9)]",
          glowLead: "bg-white shadow-[0_0_8px_#ef4444]",
          statusText: t("channelStatusImminent", { time: timeFormatted }),
        };
      }
      if (isWarning) {
        return {
          type: "warning",
          pingClass: "bg-amber-400",
          dotClass: "bg-amber-500",
          textClass: "text-amber-400 font-medium",
          barColor: "bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-400",
          barShadow: "shadow-[0_0_12px_rgba(245,158,11,0.8)]",
          glowLead: "bg-amber-100 shadow-[0_0_8px_#f59e0b]",
          statusText: t("channelStatusEndingSoon", { time: timeFormatted }),
        };
      }
      return {
        type: "nominal",
        pingClass: "bg-emerald-400",
        dotClass: "bg-emerald-400",
        textClass: "text-emerald-400/90 font-medium",
        barColor: "bg-gradient-to-r from-emerald-600 via-emerald-400 to-teal-300",
        barShadow: "shadow-[0_0_10px_rgba(52,211,153,0.7)]",
        glowLead: "bg-white shadow-[0_0_8px_#34d399]",
        statusText: secondsRemaining === null ? t("channelStatusOnline") : t("channelStatusActive", { time: timeFormatted }),
      };
    })();

    // Prevent sliding from 100% down to current on room join/mount:
    // Only enable linear width transitions after the initial non-null countdown value is established.
    const [hasAnimated, setHasAnimated] = useState(false);
    useEffect(() => {
      if (secondsRemaining !== null && !hasAnimated) {
        const timer = setTimeout(() => setHasAnimated(true), 60);
        return () => clearTimeout(timer);
      }
    }, [secondsRemaining, hasAnimated]);

    return (
      <div className='relative flex-1 min-h-0 font-mono flex flex-col px-2 sm:px-4 md:px-6 py-2 sm:py-3'>
        <div className='relative flex-1 min-h-0 w-full max-w-5xl mx-auto rounded-none border border-emerald-500/30 bg-[#09111b]/85 backdrop-blur-md flex flex-col overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.6)]'>
          {/* Crisp tactical cyber corner notches */}
          <div className='absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-emerald-400 z-20 pointer-events-none' />
          <div className='absolute top-0 right-0 w-2.5 h-2.5 border-t border-r border-emerald-400 z-20 pointer-events-none' />
          <div className='absolute bottom-0 left-0 w-2.5 h-2.5 border-b border-l border-emerald-400 z-20 pointer-events-none' />
          <div className='absolute bottom-0 right-0 w-2.5 h-2.5 border-b border-r border-emerald-400 z-20 pointer-events-none' />

          {/* Top Intelligent Telemetry & Life-Line Strip */}
          <div
            suppressHydrationWarning
            className='border-b border-slate-800/80 bg-[#070e17]/95 px-3.5 py-2 sm:px-4 sm:py-2.5 flex items-center justify-between gap-3 text-[10px] uppercase select-none relative z-10'
          >
            {/* Left: Live status beacon synced in color with stateTheme */}
            <div className='flex items-center gap-2.5 min-w-0'>
              <span className='relative flex h-2.5 w-2.5 items-center justify-center shrink-0'>
                <span
                  suppressHydrationWarning
                  className={`absolute inline-flex h-full w-full animate-ping opacity-75 ${stateTheme.pingClass}`}
                />
                <span
                  suppressHydrationWarning
                  className={`relative inline-flex h-1.5 w-1.5 ${stateTheme.dotClass}`}
                />
              </span>
              <span
                suppressHydrationWarning
                className={`truncate tracking-wider text-[10px] sm:text-[11px] ${stateTheme.textClass}`}
              >
                {stateTheme.statusText}
              </span>
            </div>

            {/* Right: Percentage relative to initial chosen TTL */}
            <div className='flex items-center gap-2 shrink-0 font-mono'>
              <span
                suppressHydrationWarning
                className={`font-bold tabular-nums tracking-widest text-[10px] sm:text-[11px] ${stateTheme.textClass}`}
              >
                {percent}%
              </span>
            </div>

            {/* Advanced Sci-Fi Ambient Laser Life-Line */}
            <div className='absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#0c1622] overflow-hidden'>
              <div
                suppressHydrationWarning
                className={`h-full ${hasAnimated ? "transition-[width] duration-1000 ease-linear" : ""} relative ${stateTheme.barColor} ${stateTheme.barShadow}`}
                style={{ width: `${percent}%` }}
              >
                {/* Laser energy head with particle glow */}
                <div
                  suppressHydrationWarning
                  className={`absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 ${stateTheme.glowLead}`}
                />
              </div>
            </div>
          </div>

          {/* Messages scroll feed */}
          <div
            ref={containerRef}
            className='flex-1 min-h-0 overflow-y-auto px-3.5 py-4 sm:px-6 sm:py-5 w-full overscroll-contain touch-pan-y'
          >
            {isLoading ? (
              <div className='flex h-full items-center justify-center text-emerald-400/70 text-[11px] md:text-[12px] uppercase tracking-widest animate-pulse'>
                {t("searchingSignal")}
              </div>
            ) : messages.length === 0 ? (
              <div className='flex flex-col h-full items-center justify-center text-center px-4 select-none opacity-60'>
                <div className='relative p-3 border border-emerald-500/30 bg-emerald-500/[0.04] mb-3 rounded-none'>
                  {/* 4 crisp tactical cyber corners */}
                  <div className='absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-emerald-400 pointer-events-none' />
                  <div className='absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-emerald-400 pointer-events-none' />
                  <div className='absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l border-emerald-400 pointer-events-none' />
                  <div className='absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-emerald-400 pointer-events-none' />

                  <div className='flex items-center justify-center gap-2'>
                    <svg
                      className='h-3 w-3 text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.8)]'
                      viewBox='0 0 24 24'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth={2.2}
                      strokeLinecap='round'
                      strokeLinejoin='round'
                    >
                      <rect x='3' y='11' width='18' height='11' rx='0' ry='0' />
                      <path d='M7 11V7a5 5 0 0 1 10 0v4' />
                    </svg>
                    <span className='text-[10px] md:text-[11px] uppercase tracking-widest text-emerald-400 font-bold'>
                      {t("emptyStateTitle")}
                    </span>
                  </div>
                </div>
                <p className='text-slate-400 text-xs tracking-wide max-w-sm'>
                  {t("emptyStateSub")}
                </p>
              </div>
            ) : (
              <div className='flex flex-col min-h-full space-y-3 sm:space-y-3.5'>
                {/* Spacer that pushes messages down when there are few messages, without breaking top scrolling when filled */}
                <div className='flex-1' />
                {messages.map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    msg={msg}
                    isOwn={msg.sender === currentUsername}
                    youLabel={t("you")}
                  />
                ))}
                <div ref={scrollAnchorRef} />
              </div>
            )}
          </div>

          {/* Jump to bottom button */}
          {hasNewMessage && (
            <div className='absolute bottom-16 left-1/2 -translate-x-1/2 z-20'>
              <button
                onClick={onJumpToBottom}
                className='flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[10px] uppercase tracking-widest px-3.5 py-1.5 rounded-none shadow-lg transition-all active:scale-95 cursor-pointer'
              >
                <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor' className='w-3.5 h-3.5'>
                  <path
                    fillRule='evenodd'
                    d='M10 3a.75.75 0 01.75.75v10.638l3.96-4.158a.75.75 0 111.08 1.04l-5.25 5.5a.75.75 0 01-1.08 0l-5.25-5.5a.75.75 0 111.08-1.04l3.96 4.158V3.75A.75.75 0 0110 3z'
                    clipRule='evenodd'
                  />
                </svg>
                {t("newMessage")}
              </button>
            </div>
          )}

          {/* Integrated Docked Composer */}
          {children}
        </div>
      </div>
    );
  },
);

ChatPanel.displayName = "ChatPanel";
export default ChatPanel;