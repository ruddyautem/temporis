"use client";

import { useState, type RefObject } from "react";
import { useTranslations } from "next-intl";

interface ChatComposerProps {
  inputRef: RefObject<HTMLInputElement | null>;
  isReady: boolean;
  isSending: boolean;
  onSend: (text: string) => void;
}

const ChatComposer = ({ inputRef, isReady, isSending, onSend }: ChatComposerProps) => {
  const t = useTranslations("Room");
  const [input, setInput] = useState("");
  const canSend = isReady && input.trim().length > 0 && !isSending;

  const submit = () => {
    if (!canSend) return;
    onSend(input);
    setInput("");
  };

  return (
    <div className='border-t border-emerald-500/20 px-3 py-2.5 sm:px-5 sm:py-3 bg-[#08101a]/95 shrink-0 font-mono'>
      <div className='flex items-center gap-2 md:gap-3 w-full'>
        <div className='relative flex-1 flex items-center'>
          <span className='absolute left-3 text-emerald-400 font-bold select-none text-xs sm:text-sm'>&gt;</span>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
            }}
            placeholder={t("inputPlaceholder")}
            className='w-full rounded-none border border-slate-700/70 bg-[#0c1624] pl-7 pr-3 py-2.5 sm:py-3 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:bg-[#0e1b2d] focus:outline-none transition-all placeholder:text-left'
          />
        </div>
        <button
          onClick={submit}
          disabled={!canSend}
          title={t("send")}
          className='group flex items-center justify-center gap-1.5 cursor-pointer rounded-none bg-emerald-500 border border-emerald-400 px-4 py-2.5 sm:py-3 text-slate-950 font-bold transition-all hover:bg-emerald-400 disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
        >
          <span className='hidden sm:inline text-[11px] uppercase tracking-wider'>{t("send")}</span>
          <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor' className='w-4 h-4'>
            <path d='M3.478 2.404a.75.75 0 00-.926.941l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.404z' />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ChatComposer;