import { handle } from "@upstash/realtime";
import { realtime } from "@/lib/realtime";
import { isRoomMember, roomPresence } from "@/lib/rooms";
import { authorizedStream } from "@/lib/authorized-stream";
import { roomConnection, roomToken } from "@/lib/request-token";

const subscribe = handle({ realtime, middleware: async ({ request, channels }) => {
  const token = roomToken(request);
  const connectionId = roomConnection(request);
  if (!token || !connectionId || channels.length !== 1 || !(await isRoomMember(channels[0], token, connectionId))) {
    return new Response("Unauthorized", { status: 401 });
  }
} });

export async function GET(request: Request) {
  const response = await subscribe(request);
  if (!response) return new Response("Realtime unavailable", { status: 503 });
  if (!response.ok || !response.body) return response;
  const token = roomToken(request) || "";
  const connectionId = roomConnection(request) || "";
  const roomId = new URL(request.url).searchParams.get("channel") || "";
  return new Response(authorizedStream(
    response.body,
    () => isRoomMember(roomId, token, connectionId),
    async () => (await roomPresence(roomId, token, "renew", connectionId))[0] > 0,
  ), { status: response.status, headers: response.headers });
}
