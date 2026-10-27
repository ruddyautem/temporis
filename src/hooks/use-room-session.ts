import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { createRoomConnection } from "@/lib/client";
import { PRESENCE_HEARTBEAT_MS } from "@/lib/room-presence-config";
import { watchRoomPageLifecycle } from "@/lib/room-page-lifecycle";

export type RoomExitReason = "destroyed" | "error" | "full";

/**
 * Owns everything related to being a member of a room: announcing presence,
 * leaving cleanly, destroying the room on demand, and the various browser
 * exit paths (tab close, back button) that need special handling because
 * closing the last tab in an empty room should delete it.
 */
export const useRoomSession = (roomId: string, username: string | undefined, connectionId: string) => {
  const router = useRouter();
  const connection = useMemo(() => createRoomConnection(connectionId), [connectionId]);
  const client = connection.api;
  const [isConnected, setIsConnected] = useState(false);

  const hasExited = useRef(false);
  const otherUsersCountRef = useRef(0);
  const [showLeaveModal, setShowLeaveModal] = useState(false);

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
    [router, username, roomId, client],
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
  }, [username, roomId, router, client]);

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

  // Each document has its own server-issued generation. Requests from the
  // outgoing document can never shorten or renew the refreshed document's slot.
  useEffect(() => {
    if (!username) return;
    let cancelled = false;
    let retry: ReturnType<typeof setTimeout> | undefined;
    const join = async () => {
      try {
        const response = await client.room.join.post({ username }, { query: { roomId } });
        if (cancelled) return;
        if (!response.error && response.data && "others" in response.data) {
          otherUsersCountRef.current = response.data.others ?? 0;
          setIsConnected(true);
        } else if (response.status === 401 || response.status === 404) {
          handleExit("error");
        } else retry = setTimeout(join, PRESENCE_HEARTBEAT_MS);
      } catch {
        if (!cancelled) retry = setTimeout(join, PRESENCE_HEARTBEAT_MS);
      }
    };
    void join();
    return () => { cancelled = true; clearTimeout(retry); };
  }, [client, roomId, username, handleExit]);

  useEffect(() => {
    if (!username) return;
    return watchRoomPageLifecycle(() => {
      if (hasExited.current) return;
      const query = new URLSearchParams({ roomId, connectionId, unload: "true" });
      const url = `/api/room/leave?${query}`;
      const body = JSON.stringify({ username });
      // Beacon survives document teardown. The server checks the generation in
      // the query because sendBeacon cannot attach a custom request header.
      let sent = false;
      try { sent = navigator.sendBeacon(url, new Blob([body], { type: "application/json" })); } catch {}
      if (!sent) void fetch(url, { method: "POST", body, headers: { "Content-Type": "application/json" }, credentials: "same-origin", keepalive: true }).catch(() => {});
    }, () => window.location.reload());
  }, [username, roomId, connectionId]);

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
    connection,
    isConnected,
    otherUsersCountRef,
    showLeaveModal,
    setShowLeaveModal,
    handleExit,
    handleConfirmedLeave,
    destroyRoom,
    isDestroying,
  };
};
