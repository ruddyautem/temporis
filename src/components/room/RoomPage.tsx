"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { copyRoomInviteLink, hasCopiedRoomInvite } from "@/lib/invite-link";
import useUsername from "@/hooks/use-username";
import { useRoomSession } from "@/hooks/use-room-session";
import { useRoomCountdown } from "@/hooks/use-room-countdown";
import { useRoomChat } from "@/hooks/use-room-chat";
import { useChatViewport } from "@/hooks/use-chat-viewport";
import LeaveConfirmDialog from "@/components/room/LeaveConfirmDialog";
import DestroyConfirmDialog from "@/components/room/DestroyConfirmDialog";
import ParticipantLeftDialog from "@/components/room/ParticipantLeftDialog";
import RoomHeader from "@/components/room/RoomHeader";
import ChatPanel from "@/components/room/ChatPanel";
import ChatComposer from "@/components/room/ChatComposer";
import AppBackground from "@/components/common/AppBackground";

const RoomPage = ({ connectionId }: { connectionId: string }) => {
  const t = useTranslations("Room");
  const router = useRouter();
  const { username } = useUsername();
  const params = useParams();
  const roomId = params.roomId as string;

  const [isClient, setIsClient] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);
  useEffect(() => { setInviteCopied(hasCopiedRoomInvite(roomId)); }, [roomId]);
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
    connection,
    isConnected,
    otherUsersCountRef,
    showLeaveModal,
    setShowLeaveModal,
    handleExit,
    handleConfirmedLeave,
    destroyRoom,
    isDestroying,
  } = useRoomSession(roomId, username, connectionId);

  const { secondsRemaining, initialSeconds } = useRoomCountdown(roomId, connection, isConnected, handleExit, otherUsersCountRef);

  const { isLoading, displayMessages, sendMessage, isSending, inputRef, departedUsername, dismissDeparture } =
    useRoomChat(roomId, connection, isConnected, username, handleExit, otherUsersCountRef, cryptoKey);

  const {
    mainRef,
    scrollAnchorRef,
    scrollContainerRef,
    hasNewMessage,
    jumpToBottom,
  } = useChatViewport(displayMessages);

  const copyInviteLink = async () => {
    const copied = await copyRoomInviteLink(roomId, window.location.hash);
    setInviteCopied(copied);
    if (copied) toast.success(t("linkCopied"), { id: "copy-toast" });
    else toast.error(t("linkCopyFailed"), { id: "copy-toast" });
    return copied;
  };

  const [showDestroyModal, setShowDestroyModal] = useState(false);

  return (
    <>
      {keyError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
          <div className="bg-[#0a1118] border border-red-500/30 p-6 md:p-8 rounded-none max-w-md w-full text-center shadow-2xl">
            <span className="text-red-500 text-4xl mb-4 block">🔒</span>
            <h2 className="text-red-400 font-bold uppercase tracking-widest mb-3 text-sm md:text-base">{t("missingKeyTitle")}</h2>
            <p className="text-slate-400 text-xs md:text-sm mb-6 leading-relaxed">
              {t("missingKeyDesc")}
            </p>
            <button
              onClick={() => router.push("/")}
              className="px-6 py-3 bg-red-500/10 text-red-400 border border-red-500/30 rounded-none text-xs uppercase tracking-widest font-bold hover:bg-red-500/20 transition-colors w-full cursor-pointer"
            >
              {t("leave")}
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

      <DestroyConfirmDialog
        isOpen={showDestroyModal}
        isDestroying={isDestroying}
        onConfirm={() => {
          destroyRoom();
        }}
        onCancel={() => setShowDestroyModal(false)}
      />

      {departedUsername && !showLeaveModal && !showDestroyModal && !keyError && (
        <ParticipantLeftDialog
          key={departedUsername}
          username={departedUsername}
          onCopyLink={copyInviteLink}
          onDestroy={() => {
            dismissDeparture();
            setShowDestroyModal(true);
          }}
          onDismiss={dismissDeparture}
        />
      )}

      <main
        ref={mainRef}
        className='room-shell relative flex flex-col bg-[#070d15] text-slate-100 overflow-hidden font-mono fixed inset-x-0 h-full'
      >
        <AppBackground variant='grid' />

        <RoomHeader />

        <div className='room-workspace relative z-10 flex-1 min-h-0'>
          <ChatPanel
            ref={scrollContainerRef}
            isLoading={isLoading}
            messages={displayMessages}
            currentUsername={username}
            inviteCopied={inviteCopied}
            onCopyLink={copyInviteLink}
            onDestroy={() => setShowDestroyModal(true)}
            isDestroying={isDestroying}
            scrollAnchorRef={scrollAnchorRef}
            hasNewMessage={hasNewMessage}
            onJumpToBottom={jumpToBottom}
            secondsRemaining={secondsRemaining}
            initialSeconds={initialSeconds}
          >
            <ChatComposer
              inputRef={inputRef}
              isReady={isClient && isConnected && !!cryptoKey}
              isSending={isSending}
              onSend={(text) => sendMessage({ text })}
            />
          </ChatPanel>
        </div>
      </main>
    </>
  );
};

export default RoomPage;
