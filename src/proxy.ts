import { NextRequest, NextResponse } from "next/server";
import { redis } from "./lib/redis";
import { nanoid } from "nanoid";

export const proxy = async (req: NextRequest) => {
  const pathname = req.nextUrl.pathname;

  const roomMatch = pathname.match(/^\/room\/([^/]+)$/);
  if (!roomMatch) return NextResponse.redirect(new URL("/", req.url));

  const roomId = roomMatch[1];

  const metaKey = `meta:${roomId}`;
  const meta = await redis.hgetall<{ connected: string[]; createdAt: number; initialTtl: number }>(
    metaKey,
  );

  if (!meta)
    return NextResponse.redirect(new URL("/?error=room-not-found", req.url));

  const existingToken = req.cookies.get("x-auth-token")?.value;
  const isCurrentlyConnected = existingToken && meta.connected.includes(existingToken);

  // 1. User is already in the connected list: allow access and refresh absolute TTL
  if (isCurrentlyConnected) {
    const absoluteRemaining = Math.max(0, Math.floor((meta.createdAt + meta.initialTtl * 1000 - Date.now()) / 1000));
    if (absoluteRemaining > 0) {
      await redis.expire(metaKey, absoluteRemaining);
    }
    return NextResponse.next();
  }

  // 2. User has an existing token from this room (they left / closed tab, now reconnecting)
  // Or room has fewer than 2 members: allow entry / re-entry
  if (meta.connected.length < 2) {
    const response = NextResponse.next();
    const token = existingToken || nanoid();

    if (!existingToken) {
      response.cookies.set("x-auth-token", token, {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });
    }

    const remaining = await redis.ttl(metaKey);
    if (remaining <= 0) {
      return NextResponse.redirect(new URL("/?error=room-not-found", req.url));
    }

    // Add back to connected list
    await redis.hset(metaKey, { connected: [...meta.connected, token] });

    const absoluteRemaining = Math.max(0, Math.floor((meta.createdAt + meta.initialTtl * 1000 - Date.now()) / 1000));
    if (absoluteRemaining > 0) {
      await redis.expire(metaKey, absoluteRemaining);
    }

    return response;
  }

  // 3. Room is actually full (2 different users currently connected)
  return NextResponse.redirect(new URL("/?error=room-full", req.url));
};

export const config = {
  matcher: "/room/:path*",
};