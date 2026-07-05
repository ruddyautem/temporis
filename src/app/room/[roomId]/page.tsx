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
  useEffect(() => setIsClient(true), []);

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
    useRoomChat(roomId, username, handleExit, otherUsersCountRef);

  const {
    mainRef,
    scrollAnchorRef,
    scrollContainerRef,
    hasNewMessage,
    jumpToBottom,
  } = useChatViewport(displayMessages);

  const copyInviteLink = () => {
    const joinUrl = `${window.location.origin}/join/${roomId}`;
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
