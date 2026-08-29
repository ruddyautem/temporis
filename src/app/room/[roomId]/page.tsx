"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "react-toastify";
import useUsername from "@/hooks/use-username";
import { useRoomSession } from "@/hooks/use-room-session";
import { useRoomCountdown } from "@/hooks/use-room-countdown";
import { useRoomChat } from "@/hooks/use-room-chat";
import { useChatViewport } from "@/hooks/use-chat-viewport";
import LeaveConfirmDialog from "@/components/room/LeaveConfirmDialog";
import RoomHeader from "@/components/room/RoomHeader";
import ChatPanel from "@/components/room/ChatPanel";
import ChatComposer from "@/components/room/ChatComposer";

const Page = () => {
  const { username } = useUsername();
  const params = useParams();
  const roomId = params.roomId as string;

  const [isClient, setIsClient] = useState(false);
  const [cryptoKey, setCryptoKey] = useState<CryptoKey | null>(null);
  const [keyError, setKeyError] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const extractKey = async () => {
      // Next.js router.push might take a tick to update window.location natively
      await new Promise(resolve => setTimeout(resolve, 50));
      try {
        const hash = window.location.hash.slice(1);
        const params = new URLSearchParams(hash);
        const keyBase64 = params.get("key");
        if (!keyBase64) throw new Error("No key in URL");

        const { importKeyFromBase64 } = await import("@/lib/crypto");
        const key = await importKeyFromBase64(keyBase64);
        setCryptoKey(key);
      } catch (err) {
        console.error(err);
        setKeyError(true);
      }
    };
    extractKey();
  }, []);

  const {
    otherUsersCountRef,
    showLeaveModal,
    setShowLeaveModal,
    handleExit,
    handleConfirmedLeave,
    destroyRoom,
    isDestroying,
  } = useRoomSession(roomId, username);

  const secondsRemaining = useRoomCountdown(roomId, handleExit);

  const { isLoading, displayMessages, sendMessage, isSending, inputRef } =
    useRoomChat(roomId, username, handleExit, otherUsersCountRef, cryptoKey);

  const {
    mainRef,
    scrollAnchorRef,
    scrollContainerRef,
    hasNewMessage,
    jumpToBottom,
  } = useChatViewport(displayMessages);

  const copyInviteLink = () => {
    const joinUrl = `${window.location.origin}/join/${roomId}${window.location.hash}`;
    navigator.clipboard.writeText(joinUrl);
    if (!toast.isActive("copy-toast")) {
      toast.success("LIEN DE SESSION COPIÉ", {
        toastId: "copy-toast",
        icon: () => "🔗",
      });
    }
  };

  return (
    <>
      {keyError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
          <div className="bg-[#0a1118] border border-red-500/30 p-6 md:p-8 rounded-2xl max-w-md w-full text-center shadow-2xl">
            <span className="text-red-500 text-4xl mb-4 block">🔒</span>
            <h2 className="text-red-400 font-bold uppercase tracking-widest mb-3 text-sm md:text-base">Clé de Déchiffrement Manquante</h2>
            <p className="text-slate-400 text-xs md:text-sm mb-6 leading-relaxed">
              Impossible d&apos;accéder à la conversation. Le lien que vous avez utilisé ne contient pas la clé de déchiffrement sécurisée.
            </p>
            <button
              onClick={() => window.location.href = "/"}
              className="px-6 py-3 bg-red-500/10 text-red-400 border border-red-500/30 rounded-xl text-xs uppercase tracking-widest font-bold hover:bg-red-500/20 transition-colors w-full"
            >
              Retour à l&apos;accueil
            </button>
          </div>
        </div>
      )}

      {showLeaveModal && (
        <LeaveConfirmDialog
          onConfirm={() => {
            setShowLeaveModal(false);
            handleConfirmedLeave();
          }}
          onCancel={() => setShowLeaveModal(false)}
        />
      )}

      <main
        ref={mainRef}
        className='flex flex-col bg-[#0d1621] text-slate-100 overflow-hidden font-mono fixed inset-x-0'
      >
        <RoomHeader
          roomId={roomId}
          secondsRemaining={secondsRemaining}
          onCopyLink={copyInviteLink}
          onDestroy={() => destroyRoom()}
          isDestroying={isDestroying}
        />

        <ChatPanel
          ref={scrollContainerRef}
          isLoading={isLoading}
          messages={displayMessages}
          currentUsername={username}
          scrollAnchorRef={scrollAnchorRef}
          hasNewMessage={hasNewMessage}
          onJumpToBottom={jumpToBottom}
        />

        <ChatComposer
          inputRef={inputRef}
          isReady={isClient}
          isSending={isSending}
          onSend={(text) => sendMessage({ text })}
        />
      </main>
    </>
  );
};

export default Page;
