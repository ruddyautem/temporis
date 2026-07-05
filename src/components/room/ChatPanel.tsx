import { forwardRef } from "react";
import { format } from "date-fns";
import type { ChatMessage } from "@/types/chat";

interface ChatPanelProps {
  isLoading: boolean;
  messages: ChatMessage[];
  currentUsername: string | undefined;
  scrollAnchorRef: React.RefObject<HTMLDivElement | null>;
  hasNewMessage: boolean;
  onJumpToBottom: () => void;
}

const MessageBubble = ({ msg, isOwn }: { msg: ChatMessage; isOwn: boolean }) => {
  if (msg.sender === "SYSTEM") {
    return (
      <div className='flex justify-center my-4 md:my-5'>
        <span className='text-[9px] md:text-[10px] uppercase tracking-widest text-slate-500 bg-slate-800/30 px-4 py-1.5 md:px-5 md:py-2 rounded-full border border-slate-700/50'>
          {msg.clearText}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex ${isOwn ? "justify-end md:justify-start" : "justify-start"}`}>
      <div
        className={`max-w-[85%] md:max-w-[75%] lg:max-w-[65%] rounded-xl border border-slate-700 bg-[#0a1118] px-3 py-2 md:px-4 md:py-3 shadow-xl ${isOwn ? "border-emerald-500/30" : ""}`}
      >
        <div className='mb-1 md:mb-2 flex items-center justify-between gap-8 md:gap-10 text-[9px] md:text-[11px] uppercase tracking-wider'>
          <span className={isOwn ? "text-emerald-400 font-bold" : "text-sky-400 font-bold"}>
            {isOwn ? (
              <>
                {msg.sender} <span className='text-white/40 lowercase'>(vous)</span>
              </>
            ) : (
              msg.sender
            )}
          </span>
          <span className='text-slate-400'>{format(msg.timestamp, "HH:mm")}</span>
        </div>
        <p className='whitespace-pre-wrap wrap-break-word text-[13px] md:text-[14px] text-slate-200 leading-relaxed'>
          {msg.clearText}
        </p>
      </div>
    </div>
  );
};

const ChatPanel = forwardRef<HTMLDivElement, ChatPanelProps>(
  ({ isLoading, messages, currentUsername, scrollAnchorRef, hasNewMessage, onJumpToBottom }, containerRef) => (
    <div className='relative flex-1 min-h-0'>
      <div
        ref={containerRef}
        className='h-full overflow-y-auto px-4 py-5 md:px-6 md:py-6 space-y-4 md:space-y-5 scroll-smooth mx-auto w-full'
      >
        {isLoading ? (
          <div className='flex h-full items-center justify-center text-slate-500 text-[10px] md:text-[12px] uppercase tracking-widest animate-pulse'>
            recherche de signal...
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <MessageBubble key={msg.id} msg={msg} isOwn={msg.sender === currentUsername} />
            ))}
            <div ref={scrollAnchorRef} />
          </>
        )}
      </div>

      {hasNewMessage && (
        <div className='absolute bottom-6 left-1/2 -translate-x-1/2 z-20'>
          <button
            onClick={onJumpToBottom}
            className='flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-[#0d1621] font-bold text-[10px] uppercase tracking-widest px-4 py-2 rounded-full shadow-lg transition-all active:scale-95 cursor-pointer'
          >
            <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor' className='w-3.5 h-3.5'>
              <path
                fillRule='evenodd'
                d='M10 3a.75.75 0 01.75.75v10.638l3.96-4.158a.75.75 0 111.08 1.04l-5.25 5.5a.75.75 0 01-1.08 0l-5.25-5.5a.75.75 0 111.08-1.04l3.96 4.158V3.75A.75.75 0 0110 3z'
                clipRule='evenodd'
              />
            </svg>
            Nouveau message
          </button>
        </div>
      )}
    </div>
  ),
);

ChatPanel.displayName = "ChatPanel";
export default ChatPanel;