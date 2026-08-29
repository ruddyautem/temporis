import { useMutation, useQuery } from "@tanstack/react-query";
import { useRef, useState, type MutableRefObject } from "react";
import { toast } from "react-toastify";
import { client } from "@/lib/client";
import { encryptText, decryptText } from "@/lib/crypto";
import { useRealtime } from "@/lib/realtime-client";
import type { ChatMessage } from "@/types/chat";
import type { RoomExitReason } from "./use-room-session";

export const useRoomChat = (
  roomId: string,
  username: string | undefined,
  handleExit: (reason: RoomExitReason) => void,
  otherUsersCountRef: MutableRefObject<number>,
  cryptoKey: CryptoKey | null
) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [systemEvents, setSystemEvents] = useState<ChatMessage[]>([]);

  const { data: messages, refetch } = useQuery({
    queryKey: ["messages", roomId],
    queryFn: async () => {
      const res = await client.messages.get({ query: { roomId } });
      if (res.error || !res.data) {
        handleExit(res.status === 403 ? "full" : "error");
        return null;
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
    retry: false,
    enabled: !!cryptoKey,
  });

  const { mutate: sendMessage, isPending } = useMutation({
    mutationFn: async ({ text }: { text: string }) => {
      if (!cryptoKey) throw new Error("No encryption key");
      const encrypted = await encryptText(text, cryptoKey);
      await client.messages.post(
        { sender: username || "Anonyme", text: encrypted },
        { query: { roomId } },
      );
      inputRef.current?.focus();
    },
  });

  const activeUsersRef = useRef<Set<string>>(new Set());

  useRealtime({
    channels: [roomId],
    events: ["chat.message", "chat.destroy", "chat.join", "chat.leave"],
    onData: ({ event, data }) => {
      if (event === "chat.message") refetch();
      if (event === "chat.destroy") handleExit("destroyed");

      if (event === "chat.join" || event === "chat.leave") {
        if (data.username === username) return;

        if (event === "chat.join") {
          if (activeUsersRef.current.has(data.username)) return;
          activeUsersRef.current.add(data.username);
          otherUsersCountRef.current = activeUsersRef.current.size;

          toast.info(
            <span>
              <span className='text-emerald-400 font-bold'>
                {data.username}
              </span>{" "}
              A REJOINT LA SESSION
            </span>,
            { icon: () => "👋" },
          );
          setSystemEvents((prev) => [
            ...prev,
            {
              id: `sys-join-${Date.now()}-${Math.random()}`,
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
          activeUsersRef.current.delete(data.username);
          otherUsersCountRef.current = activeUsersRef.current.size;

          toast.error(
            <span>
              <span className='text-red-500 font-bold'>{data.username}</span> A
              QUITTÉ LA SESSION
            </span>,
            { icon: () => "🚪" },
          );
          setSystemEvents((prev) => [
            ...prev,
            {
              id: `sys-leave-${Date.now()}-${Math.random()}`,
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
  };
};
