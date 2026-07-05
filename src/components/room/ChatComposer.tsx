import { useState, type RefObject } from "react";

interface ChatComposerProps {
  inputRef: RefObject<HTMLInputElement | null>;
  isReady: boolean;
  isSending: boolean;
  onSend: (text: string) => void;
}

const ChatComposer = ({ inputRef, isReady, isSending, onSend }: ChatComposerProps) => {
  const [input, setInput] = useState("");
  const canSend = isReady && input.trim().length > 0 && !isSending;

  const submit = () => {
    if (!canSend) return;
    onSend(input);
    setInput("");
  };

  return (
    <footer className='border-t border-slate-700 p-4 md:p-5 lg:p-6 bg-[#0d1621] shrink-0'>
      <div className='flex items-center gap-2 md:gap-4 w-full mx-auto'>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          placeholder='Votre message...'
          className='flex-1 min-w-0 rounded-xl border border-slate-700 bg-[#0a1118] px-4 py-3 md:px-5 md:py-4 text-[13px] md:text-[14px] text-slate-100 placeholder:text-slate-600 focus:border-emerald-500/50 focus:outline-none transition-all placeholder:text-left'
        />
        <button
          onClick={submit}
          disabled={!canSend}
          className='group flex items-center justify-center gap-2 cursor-pointer rounded-xl bg-emerald-400/50 border border-emerald-500/20 p-3 md:px-8 md:py-4 text-[10px] md:text-[11px] uppercase tracking-widest text-emerald-400 font-bold transition-all hover:bg-emerald-400/80 disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 shrink-0'
        >
          <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='#fff' className='w-12 h-5 md:w-6 md:h-5'>
            <path d='M3.478 2.404a.75.75 0 00-.926.941l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.404z' />
          </svg>
        </button>
      </div>
    </footer>
  );
};

export default ChatComposer;