import { useMutation, useQuery } from "@tanstack/react-query";
import { useRef, useState, type MutableRefObject } from "react";
import { toast } from "sonner";
import type { RoomConnection } from "@/lib/client";
import { encryptText, decryptText } from "@/lib/crypto";
import { useRealtime } from "@/lib/realtime-client";
import type { ChatMessage } from "@/types/chat";
import type { RoomExitReason } from "./use-room-session";

export const useRoomChat = (
  roomId: string,
  connection: RoomConnection,
  isConnected: boolean,
  username: string | undefined,
  handleExit: (reason: RoomExitReason) => void,
  otherUsersCountRef: MutableRefObject<number>,
  cryptoKey: CryptoKey | null
) => {
  const client = connection.api;
  const inputRef = useRef<HTMLInputElement>(null);
  const [systemEvents, setSystemEvents] = useState<ChatMessage[]>([]);
  const [departedUsername, setDepartedUsername] = useState<string | null>(null);

  const { data: messages, refetch } = useQuery({
    queryKey: ["messages", roomId, connection.id],
    queryFn: async () => {
      const res = await client.messages.get({ query: { roomId } });
      if (res.error || !res.data || !("messages" in res.data)) {
        if (res.status === 401 || res.status === 403 || res.status === 404) {
          handleExit(res.status === 403 ? "full" : "error");
          return null;
        }
        throw new Error("Room messages unavailable");
      }
      
      if (!cryptoKey) return { messages: [] };

      const decrypted = await Promise.all(
        res.data.messages.map(async (msg) => ({
          ...msg,
          clearText: await decryptText(msg.text, cryptoKey),
        })),
      );
      return { messages: decrypted };
    },
    refetchInterval: 10000,
    retry: false,
    enabled: isConnected && !!cryptoKey,
  });

  const { mutateAsync: sendMessage, isPending } = useMutation({
    mutationFn: async ({ text }: { text: string }) => {
      if (!cryptoKey) throw new Error("No encryption key");
      if (new TextEncoder().encode(text).length > 5000) throw new Error("Message trop long (5 000 octets maximum).");
      const encrypted = await encryptText(text, cryptoKey);
      const res = await client.messages.post(
        { sender: username || "Anonyme", text: encrypted },
        { query: { roomId } },
      );
      if (res.error) throw new Error("Message non envoyé. Réessaie.");
      await refetch();
    },
  });

  const activeUsersRef = useRef<Set<string>>(new Set());
  const departedUsersRef = useRef<Set<string>>(new Set());

  useRealtime({
    enabled: isConnected,
    channels: [roomId],
    events: ["chat.message", "chat.destroy", "chat.join", "chat.leave"],
    onData: ({ event, data }) => {
      if (event === "chat.message") refetch();
      if (event === "chat.destroy") handleExit("destroyed");

      if (event === "chat.join" || event === "chat.leave") {
        if (data.username === username) return;

        if (event === "chat.join") {
          setDepartedUsername(null);
          departedUsersRef.current.delete(data.username);
          if (activeUsersRef.current.has(data.username)) return;
          activeUsersRef.current.add(data.username);
          otherUsersCountRef.current = activeUsersRef.current.size;

          toast.info(`${data.username} a rejoint la room`, {
            icon: "👋",
          });
          setSystemEvents((prev) => [
            ...prev,
            {
              id: `sys-join-${Date.now()}-${Math.random()}`,
              sender: "SYSTEM",
              clearText: (
                <>
                  <span className='text-white font-bold'>{data.username}</span>{" "}
                  a rejoint la room
                </>
              ),
              timestamp: Date.now(),
            },
          ]);
        }

        if (event === "chat.leave") {
          if (departedUsersRef.current.has(data.username)) return;
          departedUsersRef.current.add(data.username);
          activeUsersRef.current.delete(data.username);
          otherUsersCountRef.current = activeUsersRef.current.size;


          setDepartedUsername(data.username);
          setSystemEvents((prev) => [
            ...prev,
            {
              id: `sys-leave-${Date.now()}-${Math.random()}`,
              sender: "SYSTEM",
              clearText: (
                <>
                  <span className='text-red-400 font-bold'>
                    {data.username}
                  </span>{" "}
                  a quitté la room
                </>
              ),
              timestamp: Date.now(),
            },
          ]);
        }
      }
    },
  });

  const displayMessages: ChatMessage[] = [
    ...(messages?.messages ?? []),
    ...systemEvents,
  ].sort((a, b) => a.timestamp - b.timestamp);

  return {
    isLoading: !messages,
    displayMessages,
    sendMessage,
    isSending: isPending,
    inputRef,
    departedUsername,
    dismissDeparture: () => setDepartedUsername(null),
  };
};
