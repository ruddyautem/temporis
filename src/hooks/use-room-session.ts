import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { client } from "@/lib/client";

export type RoomExitReason = "destroyed" | "error" | "full";

/**
 * Owns everything related to being a member of a room: announcing presence,
 * leaving cleanly, destroying the room on demand, and the various browser
 * exit paths (tab close, back button) that need special handling because
 * closing the last tab in an empty room should delete it.
 */
export const useRoomSession = (roomId: string, username: string | undefined) => {
  const router = useRouter();

  const hasExited = useRef(false);
  const hasAnnouncedJoin = useRef(false);
  const otherUsersCountRef = useRef(0);
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  // Announce presence once we know our username.
  useEffect(() => {
    if (!username || hasAnnouncedJoin.current) return;
    hasAnnouncedJoin.current = true;
    client.room.join.post({ username }, { query: { roomId } }).catch(() => {});
  }, [username, roomId]);

  /** Redirect away from a room that no longer exists / errored / is full. */
  const handleExit = useCallback(
    (reason: RoomExitReason) => {
      if (hasExited.current) return;
      hasExited.current = true;

      if (username) {
        client.room.leave.post({ username }, { query: { roomId } }).catch(() => {});
      }

      toast.dismiss();
      if (reason === "destroyed") router.replace("/?destroyed=true");
      else if (reason === "full") router.replace("/?error=room-full");
      else router.replace("/?error=room-not-found");
    },
    [router, username, roomId],
  );

  /** User explicitly clicked "leave" (after confirming, if they were alone). */
  const handleConfirmedLeave = useCallback(() => {
    if (hasExited.current) return;
    hasExited.current = true;

    const isAlone = otherUsersCountRef.current === 0;

    if (username) {
      client.room.leave.post({ username }, { query: { roomId } }).catch(() => {});
    }
    if (isAlone) {
      client.room.delete(null, { query: { roomId } }).catch(() => {});
    }

    router.replace(isAlone ? "/?destroyed=true" : "/");
  }, [username, roomId, router]);

  /** Explicit "Détruire" button — deletes the room outright, for everyone. */
  const { mutate: destroyRoom, isPending: isDestroying } = useMutation({
    mutationFn: async () => {
      await client.room.delete(null, { query: { roomId } });
    },
    onError: () => {
      toast.error("Échec de la destruction de la room.");
    },
  });

  // Tab close / refresh: leave, and delete the room too if we're the last one there.
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
        fetch(`/api/room?roomId=${roomId}`, { method: "DELETE", keepalive: true }).catch(() => {});
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      handleTabClose();
      if (otherUsersCountRef.current === 0) e.preventDefault();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [username, roomId]);

  // Back/forward navigation: if alone, intercept and show the confirmation modal
  // instead of silently leaving (which would destroy the room).
  useEffect(() => {
    const handlePopState = () => {
      if (otherUsersCountRef.current === 0 && !hasExited.current) {
        window.history.pushState(null, "", window.location.href);
        setShowLeaveModal(true);
      }
    };

    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  return {
    otherUsersCountRef,
    showLeaveModal,
    setShowLeaveModal,
    handleExit,
    handleConfirmedLeave,
    destroyRoom,
    isDestroying,
  };
};