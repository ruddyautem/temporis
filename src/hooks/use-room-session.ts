import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
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
    client.room.join.post({ username }, { query: { roomId } }).then(res => {
      if (res.error) toast.error("Connexion à la room impossible.");
      else if (res.data && "others" in res.data) otherUsersCountRef.current = res.data.others ?? 0;
    }).catch(() => toast.error("Connexion à la room impossible."));
  }, [username, roomId]);

  /** Redirect away from a room that no longer exists / errored / is full. */
  const handleExit = useCallback(
    (reason: RoomExitReason) => {
      if (hasExited.current) return;
      hasExited.current = true;

      if (username && reason !== "destroyed") {
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

    router.replace(isAlone ? "/?destroyed=true" : "/");
  }, [username, roomId, router]);

  /** Explicit "Détruire" button — deletes the room outright, for everyone. */
  const { mutate: destroyRoom, isPending: isDestroying } = useMutation({
    mutationFn: async () => {
      if (hasExited.current) return "destroyed" as const;
      const res = await client.room.delete(null, { query: { roomId } });
      // A successful DELETE is the source of truth; realtime delivery is optional.
      // An expired membership exits safely without claiming the deletion succeeded.
      if (res.error) {
        if (res.status === 401 || res.status === 404) return "error" as const;
        throw new Error("Deletion failed");
      }
      return "destroyed" as const;
    },
    onSuccess: (reason) => {
      handleExit(reason);
    },
    onError: () => {
      toast.error("Échec de la fermeture de la room.");
    },
  });

  // Tab close / refresh: leave the room.
  // Using fetch keepalive (with credentials: 'include') so cookies are guaranteed to be sent
  // across all modern browsers.
  useEffect(() => {
    if (!username) return;

    let tabCloseFired = false;
    const handleTabClose = () => {
      if (tabCloseFired) return;
      tabCloseFired = true;

      const url = `/api/room/leave?roomId=${encodeURIComponent(roomId)}&unload=true`;
      const data = JSON.stringify({ username });

      try {
        fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: data,
          keepalive: true,
          credentials: "include",
        }).catch(() => {});
      } catch {
        if (navigator.sendBeacon) {
          const blob = new Blob([data], { type: "application/json" });
          navigator.sendBeacon(url, blob);
        }
      }
    };

    window.addEventListener("beforeunload", handleTabClose);
    window.addEventListener("pagehide", handleTabClose);
    return () => {
      window.removeEventListener("beforeunload", handleTabClose);
      window.removeEventListener("pagehide", handleTabClose);
    };
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
