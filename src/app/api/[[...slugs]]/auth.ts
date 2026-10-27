import { isRoomMember } from "@/lib/rooms";
import Elysia from "elysia";

class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

export const authMiddleware = new Elysia({ name: "auth" })
  .error({ AuthError })
  .onError({ as: "scoped" }, ({ code, set }) => {
    if (code === "AuthError") {
      set.status = 401;
      return { error: "Unauthorized" };
    }
  })
  .derive({ as: "scoped" }, async ({ query, cookie, headers }) => {
    const roomId = query.roomId;
    const token = cookie["x-auth-token"]?.value as string | undefined;

    if (!roomId || !token) {
      throw new AuthError("Missing roomId or token.");
    }

    const connectionId = headers["x-room-connection"] || query.connectionId;
    if (!(await isRoomMember(roomId, token, connectionId))) {
      throw new AuthError("Invalid token.");
    }
    return { auth: { roomId, token, connectionId: connectionId! } };
  });
