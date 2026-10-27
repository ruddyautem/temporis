import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { roomPresence, validRoomId } from "./lib/rooms";
import { CONNECTION_HEADER } from "./lib/room-presence-config";

export const proxy = async (req: NextRequest) => {
  const roomId = req.nextUrl.pathname.match(/^\/room\/([^/]+)$/)?.[1];
  if (!roomId) return NextResponse.redirect(new URL("/", req.url));
  const cookieToken = req.cookies.get("x-auth-token")?.value;
  const token = cookieToken && validRoomId(cookieToken) ? cookieToken : nanoid();
  const connectionId = nanoid();
  const [count] = await roomPresence(roomId, token, "admit", connectionId);
  if (count < 0) return NextResponse.redirect(new URL(count === -2 ? "/?error=room-full" : "/?error=room-not-found", req.url));
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set(CONNECTION_HEADER, connectionId);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.cookies.set("x-auth-token", token, { path: "/", httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict" });
  return response;
};
export const config = {
  matcher: [{ source: "/room/:path*", missing: [{ type: "header", key: "next-router-prefetch" }, { type: "header", key: "purpose", value: "prefetch" }] }],
};
