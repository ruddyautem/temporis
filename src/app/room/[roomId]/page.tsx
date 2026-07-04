"use client";

import useUsername from "@/hooks/use-username";
import { client } from "@/lib/client";
import { encryptText, decryptText } from "@/lib/crypto";
import { useRealtime } from "@/lib/realtime-client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useCallback } from "react";
import { toast } from "react-toastify";

const formatTimeRemaining = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const Page = () => {
  const { username } = useUsername();
  const params = useParams();
  const roomId = params.roomId as string;
  const router = useRouter();

  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const lastSyncedTtl = useRef<number | undefined>(undefined);

  const hasExited = useRef(false);
  const hasAnnouncedJoin = useRef(false);
  const [isClient, setIsClient] = useState(false);
  const [isUserScrolledUp, setIsUserScrolledUp] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const isUserScrolledUpRef = useRef(false);
  const otherUsersCountRef = useRef(0);

  // Custom leave confirmation modal state
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  const [localEvents, setLocalEvents] = useState<any[]>([]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!username) return;
    if (!hasAnnouncedJoin.current) {
      hasAnnouncedJoin.current = true;
      client.room.join
        .post({ username }, { query: { roomId } })
        .catch(() => {});
    }
  }, [username, roomId]);

  const handleExit = useCallback(
    (reason: "destroyed" | "error" | "full") => {
      if (hasExited.current) return;
      hasExited.current = true;
      if (username) {
        client.room.leave
          .post({ username }, { query: { roomId } })
          .catch(() => {});
      }
      toast.dismiss();
      if (reason === "destroyed") {
        router.replace("/?destroyed=true");
      } else if (reason === "full") {
        router.replace("/?error=room-full");
      } else {
        router.replace("/?error=room-not-found");
      }
    },
    [router, username, roomId],
  );

  const handleConfirmedLeave = useCallback(() => {
    if (hasExited.current) return;
    hasExited.current = true;

    const isAlone = otherUsersCountRef.current === 0;

    if (username) {
      client.room.leave
        .post({ username }, { query: { roomId } })
        .catch(() => {});
    }

    if (isAlone) {
      client.room.delete(null, { query: { roomId } }).catch(() => {});
    }

    router.replace(isAlone ? "/?destroyed=true" : "/");
  }, [username, roomId, router]);

  // Intercept browser close/refresh — native dialog only (unavoidable)
  // For tab close when alone, we still fire delete via keepalive fetch
  useEffect(() => {
    if (!username) return;
    const handleTabClose = () => {
      fetch(`/api/room/leave?roomId=${roomId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
        keepalive: true,
      }).catch(() => {});

      if (otherUsersCountRef.current === 0) {
        fetch(`/api/room?roomId=${roomId}`, {
          method: "DELETE",
          keepalive: true,
        }).catch(() => {});
      }
    };

    // Only block unload (show native dialog) if user is alone
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      handleTabClose();
      if (otherUsersCountRef.current === 0) {
        e.preventDefault();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [username, roomId]);

  // Intercept back/forward navigation inside Next.js
  useEffect(() => {
    const handlePopState = () => {
      if (otherUsersCountRef.current === 0 && !hasExited.current) {
        // Push state back so user stays on page while modal is shown
        window.history.pushState(null, "", window.location.href);
        setShowLeaveModal(true);
      }
    };

    // Push a state so popstate fires on back press
    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const copyLink = useCallback(() => {
    if (typeof window === "undefined") return;
    const joinUrl = `${window.location.origin}/join/${roomId}`;
    navigator.clipboard.writeText(joinUrl);
    if (!toast.isActive("copy-toast")) {
      toast.success("LIEN DE SESSION COPIÉ", {
        toastId: "copy-toast",
        icon: () => "🔗",
      });
    }
  }, [roomId]);

  const { data: ttlData } = useQuery({
    queryKey: ["ttl", roomId],
    queryFn: async () => {
      const res = await client.room.ttl.get({ query: { roomId } });
      return res.data;
    },
    refetchInterval: 10000,
    retry: false,
  });

  useEffect(() => {
    if (ttlData?.ttl !== undefined && ttlData.ttl !== lastSyncedTtl.current) {
      setTimeRemaining(ttlData.ttl);
      lastSyncedTtl.current = ttlData.ttl;
    }
  }, [ttlData?.ttl]);

  const isTimerActive = timeRemaining !== null;
  useEffect(() => {
    if (!isTimerActive) return;
    const interval = setInterval(() => {
      setTimeRemaining((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerActive]);

  useEffect(() => {
    if (timeRemaining === 0) handleExit("destroyed");
  }, [timeRemaining, handleExit]);

  const { data: messages, refetch } = useQuery({
    queryKey: ["messages", roomId],
    queryFn: async () => {
      const res = await client.messages.get({ query: { roomId } });
      if (res.error || !res.data) {
        if (res.status === 403) handleExit("full");
        else handleExit("error");
        return null;
      }
      const decryptedMessages = await Promise.all(
        res.data.messages.map(async (msg) => ({
          ...msg,
          clearText: await decryptText(msg.text),
        })),
      );
      return { messages: decryptedMessages };
    },
    retry: false,
  });

  const displayMessages = [...(messages?.messages || []), ...localEvents].sort(
    (a, b) => a.timestamp - b.timestamp,
  );

  const scrollToBottom = useCallback(() => {
    if (isUserScrolledUpRef.current) return;
    setTimeout(() => {
      scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      setHasNewMessage(false);
    }, 150);
  }, []);

  const handleScrollToBottomClick = useCallback(() => {
    isUserScrolledUpRef.current = false;
    setIsUserScrolledUp(false);
    setHasNewMessage(false);
    setTimeout(() => {
      scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, 50);
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const handleScroll = () => {
      const distanceFromBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight;
      const scrolledUp = distanceFromBottom > 80;
      isUserScrolledUpRef.current = scrolledUp;
      setIsUserScrolledUp(scrolledUp);
      if (!scrolledUp) setHasNewMessage(false);
    };
    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (displayMessages.length === 0) return;
    if (isUserScrolledUpRef.current) {
      setHasNewMessage(true);
    } else {
      scrollToBottom();
    }
  }, [displayMessages, scrollToBottom]);

  useEffect(() => {
    let lastHeight = window.visualViewport?.height ?? window.innerHeight;
    const updateLayout = () => {
      const vv = window.visualViewport;
      if (!vv || !mainRef.current) return;
      const heightChanged = vv.height !== lastHeight;
      lastHeight = vv.height;
      mainRef.current.style.height = `${vv.height}px`;
      mainRef.current.style.top = `${vv.offsetTop}px`;
      if (heightChanged && !isUserScrolledUpRef.current) {
        setTimeout(() => {
          scrollRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "end",
          });
        }, 150);
      }
    };
    const vv = window.visualViewport;
    if (!vv) return;
    vv.addEventListener("resize", updateLayout);
    vv.addEventListener("scroll", updateLayout);
    updateLayout();
    return () => {
      vv.removeEventListener("resize", updateLayout);
      vv.removeEventListener("scroll", updateLayout);
    };
  }, []);

  useRealtime({
    channels: [roomId],
    events: ["chat.message", "chat.destroy", "chat.join", "chat.leave"],
    onData: ({ event, data }) => {
      if (event === "chat.message") refetch();
      if (event === "chat.destroy") handleExit("destroyed");
      if (event === "chat.join" || event === "chat.leave") {
        if (data.username === username) return;
        if (event === "chat.join") {
          otherUsersCountRef.current += 1;
          toast.info(
            <span>
              <span className='text-emerald-400 font-bold'>
                {data.username}
              </span>{" "}
              A REJOINT LA SESSION
            </span>,
            { icon: () => "👋" },
          );
          setLocalEvents((prev) => [
            ...prev,
            {
              id: `local-sys-join-${Date.now()}-${Math.random()}`,
              sender: "SYSTEM",
              clearText: (
                <>
                  <span className='text-white font-bold'>{data.username}</span>{" "}
                  a rejoint la session
                </>
              ),
              timestamp: Date.now(),
            },
          ]);
        }
        if (event === "chat.leave") {
          otherUsersCountRef.current = Math.max(
            0,
            otherUsersCountRef.current - 1,
          );
          toast.error(
            <span>
              <span className='text-red-500 font-bold'>{data.username}</span> A
              QUITTÉ LA SESSION
            </span>,
            { icon: () => "🚪" },
          );
          setLocalEvents((prev) => [
            ...prev,
            {
              id: `local-sys-leave-${Date.now()}-${Math.random()}`,
              sender: "SYSTEM",
              clearText: (
                <>
                  <span className='text-red-500 font-bold'>
                    {data.username}
                  </span>{" "}
                  a quitté la session
                </>
              ),
              timestamp: Date.now(),
            },
          ]);
        }
      }
    },
  });

  const { mutate: destroyRoom } = useMutation({
    mutationFn: async () => {
      await client.room.delete(null, { query: { roomId } });
    },
  });

  const { mutate: sendMessage, isPending } = useMutation({
    mutationFn: async ({ text }: { text: string }) => {
      const encrypted = await encryptText(text);
      await client.messages.post(
        { sender: username, text: encrypted },
        { query: { roomId } },
      );
      setInput("");
      inputRef.current?.focus();
    },
  });

  const canSend = isClient && input.trim().length > 0 && !isPending;

  return (
    <>
      {/* Custom leave confirmation modal — only shown when alone */}
      {showLeaveModal && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm font-mono'>
          <div className='mx-4 w-full max-w-sm rounded-2xl border border-slate-700 bg-[#0d1621] p-6 shadow-2xl'>
            {/* Icon */}
            <div className='mb-4 flex justify-center'>
              <div className='flex h-12 w-12 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10'>
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  viewBox='0 0 24 24'
                  fill='currentColor'
                  className='h-6 w-6 text-red-500'
                >
                  <path
                    fillRule='evenodd'
                    d='M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z'
                    clipRule='evenodd'
                  />
                </svg>
              </div>
            </div>

            {/* Title */}
            <p className='mb-1 text-center text-[11px] uppercase tracking-[0.3em] text-slate-500'>
              Attention
            </p>
            <h2 className='mb-2 text-center text-[15px] font-bold uppercase tracking-widest text-slate-100'>
              Quitter la session ?
            </h2>

            {/* Body */}
            <p className='mb-6 text-center text-[11px] leading-relaxed text-slate-400'>
              Vous êtes{" "}
              <span className='font-bold text-red-400'>
                seul dans cette room
              </span>
              . Si vous partez, elle sera{" "}
              <span className='font-bold text-red-400'>
                définitivement détruite
              </span>{" "}
              et tous les messages effacés.
            </p>

            {/* Buttons */}
            <div className='flex flex-col gap-2'>
              <button
                onClick={() => {
                  setShowLeaveModal(false);
                  handleConfirmedLeave();
                }}
                className='w-full cursor-pointer rounded-xl border border-red-500/30 bg-red-500/10 py-3 text-[11px] font-bold uppercase tracking-[0.2em] text-red-400 transition-all hover:bg-red-500/20 active:scale-95'
              >
                Quitter et détruire
              </button>
              <button
                onClick={() => setShowLeaveModal(false)}
                className='w-full cursor-pointer rounded-xl border border-slate-700 bg-slate-800/50 py-3 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 transition-all hover:bg-slate-700/50 active:scale-95'
              >
                Rester
              </button>
            </div>
          </div>
        </div>
      )}

      <main
        ref={mainRef}
        className='flex flex-col bg-[#0d1621] text-slate-100 overflow-hidden font-mono fixed inset-x-0'
      >
        <header className='border-b border-slate-700 p-4 md:p-5 lg:p-6 shrink-0 bg-[#0d1621]/95 backdrop-blur-md z-10'>
          <div className='mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 relative'>
            {/* Mobile Timer */}
            <div className='flex flex-col items-center md:hidden'>
              <p className='text-[12px] uppercase tracking-[0.4em] text-slate-500 mb-1'>
                Autodestruction
              </p>
              <p
                className={`text-2xl font-bold tabular-nums ${
                  timeRemaining !== null && timeRemaining < 60
                    ? "text-red-500 animate-pulse"
                    : "text-emerald-400"
                }`}
              >
                {timeRemaining !== null
                  ? formatTimeRemaining(timeRemaining)
                  : "--:--"}
              </p>
            </div>

            {/* Share button */}
            <div className='flex justify-center items-stretch gap-2 md:gap-3'>
              <button
                onClick={copyLink}
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

              {/* Destroy — Mobile */}
              <button
                onClick={() => destroyRoom()}
                className='md:hidden flex items-center justify-center bg-red-500/10 border border-red-500/30 text-red-500 px-3 rounded-xl text-[10px] font-bold uppercase tracking-widest active:scale-95 cursor-pointer'
              >
                Détruire
              </button>
            </div>

            {/* Desktop Timer */}
            <div className='hidden md:flex flex-col items-center absolute left-1/2 -translate-x-1/2'>
              <p className='text-[10px] md:text-[11px] uppercase tracking-[0.4em] text-slate-500 mb-1'>
                Autodestruction
              </p>
              <p
                className={`text-3xl md:text-4xl font-bold tabular-nums ${
                  timeRemaining !== null && timeRemaining < 60
                    ? "text-red-500 animate-pulse"
                    : "text-emerald-400"
                }`}
              >
                {timeRemaining !== null
                  ? formatTimeRemaining(timeRemaining)
                  : "--:--"}
              </p>
            </div>

            {/* Destroy — Desktop */}
            <div className='hidden md:block'>
              <button
                onClick={() => destroyRoom()}
                className='cursor-pointer rounded-xl bg-red-500/5 border border-red-500/20 px-6 py-3 md:px-8 md:py-3.5 text-[11px] md:text-[12px] font-bold uppercase tracking-[0.2em] text-red-500 transition-all hover:bg-red-500/20 active:scale-95'
              >
                Détruire
              </button>
            </div>
          </div>
        </header>

        <div
          ref={scrollContainerRef}
          className='flex-1 overflow-y-auto px-4 py-5 md:px-6 md:py-6 space-y-4 md:space-y-5 scroll-smooth mx-auto w-full relative'
        >
          {!messages ? (
            <div className='flex h-full items-center justify-center text-slate-500 text-[10px] md:text-[12px] uppercase tracking-widest animate-pulse'>
              recherche de signal...
            </div>
          ) : (
            <>
              {displayMessages.map((msg) => {
                if (msg.sender === "SYSTEM") {
                  return (
                    <div
                      key={msg.id}
                      className='flex justify-center my-4 md:my-5'
                    >
                      <span className='text-[9px] md:text-[10px] uppercase tracking-widest text-slate-500 bg-slate-800/30 px-4 py-1.5 md:px-5 md:py-2 rounded-full border border-slate-700/50'>
                        {msg.clearText}
                      </span>
                    </div>
                  );
                }
                const isOwn = msg.sender === username;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isOwn ? "justify-end md:justify-start" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] md:max-w-[75%] lg:max-w-[65%] rounded-xl border border-slate-700 bg-[#0a1118] px-3 py-2 md:px-4 md:py-3 shadow-xl ${isOwn ? "border-emerald-500/30" : ""}`}
                    >
                      <div className='mb-1 md:mb-2 flex items-center justify-between gap-8 md:gap-10 text-[9px] md:text-[11px] uppercase tracking-wider'>
                        <span
                          className={
                            isOwn
                              ? "text-emerald-400 font-bold"
                              : "text-sky-400 font-bold"
                          }
                        >
                          {isOwn ? (
                            <>
                              {msg.sender}{" "}
                              <span className='text-white/40 lowercase'>
                                (vous)
                              </span>
                            </>
                          ) : (
                            msg.sender
                          )}
                        </span>
                        <span className='text-slate-400'>
                          {format(msg.timestamp, "HH:mm")}
                        </span>
                      </div>
                      <p className='whitespace-pre-wrap wrap-break-word text-[13px] md:text-[14px] text-slate-200 leading-relaxed'>
                        {msg.clearText}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={scrollRef} />
            </>
          )}
        </div>

        {/* New message badge */}
        {hasNewMessage && isUserScrolledUp && (
          <div className='absolute bottom-24 left-1/2 -translate-x-1/2 z-20'>
            <button
              onClick={handleScrollToBottomClick}
              className='flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-[#0d1621] font-bold text-[10px] uppercase tracking-widest px-4 py-2 rounded-full shadow-lg transition-all active:scale-95 cursor-pointer'
            >
              <svg
                xmlns='http://www.w3.org/2000/svg'
                viewBox='0 0 20 20'
                fill='currentColor'
                className='w-3.5 h-3.5'
              >
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

        <footer className='border-t border-slate-700 p-4 md:p-5 lg:p-6 bg-[#0d1621] shrink-0'>
          <div className='flex items-center gap-2 md:gap-4 w-full mx-auto'>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && canSend) sendMessage({ text: input });
              }}
              placeholder='Votre message...'
              className='flex-1 min-w-0 rounded-xl border border-slate-700 bg-[#0a1118] px-4 py-3 md:px-5 md:py-4 text-[13px] md:text-[14px] text-slate-100 placeholder:text-slate-600 focus:border-emerald-500/50 focus:outline-none transition-all placeholder:text-left'
            />
            <button
              onClick={() => {
                if (canSend) sendMessage({ text: input });
              }}
              disabled={!canSend}
              className='group flex items-center justify-center gap-2 cursor-pointer rounded-xl bg-emerald-400/50 border border-emerald-500/20 p-3 md:px-8 md:py-4 text-[10px] md:text-[11px] uppercase tracking-widest text-emerald-400 font-bold transition-all hover:bg-emerald-400/80 disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 shrink-0'
            >
              <svg
                xmlns='http://www.w3.org/2000/svg'
                viewBox='0 0 24 24'
                fill='#fff'
                className='w-12 h-5 md:w-6 md:h-5'
              >
                <path d='M3.478 2.404a.75.75 0 00-.926.941l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.404z' />
              </svg>
            </button>
          </div>
        </footer>
      </main>
    </>
  );
};

export default Page;
