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

  // USER IS ALLOWED TO JOIN ROOM
  if (isCurrentlyConnected) {
    // Re-apply the absolute TTL
    const absoluteRemaining = Math.max(0, Math.floor((meta.createdAt + meta.initialTtl * 1000 - Date.now()) / 1000));
    if (absoluteRemaining > 0) {
      await redis.expire(metaKey, absoluteRemaining);
    }
    return NextResponse.next();
  }

  // USER IS NOT ALLOWED TO JOIN
  if (meta.connected.length >= 2) {
    return NextResponse.redirect(new URL("/?error=room-full", req.url));
  }

  // ADD NEW USER
  const response = NextResponse.next();
  const token = nanoid();
  response.cookies.set("x-auth-token", token, {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  // Get remaining TTL BEFORE updating
  const remaining = await redis.ttl(metaKey);
  if (remaining <= 0) {
    return NextResponse.redirect(new URL("/?error=room-not-found", req.url));
  }

  // Update connected list
  await redis.hset(metaKey, { connected: [...meta.connected, token] });

  // Re-apply the absolute TTL (recovering from a possible 10s grace period)
  const absoluteRemaining = Math.max(0, Math.floor((meta.createdAt + meta.initialTtl * 1000 - Date.now()) / 1000));
  if (absoluteRemaining > 0) {
    await redis.expire(metaKey, absoluteRemaining);
  }

  return response;
};

export const config = {
  matcher: "/room/:path*",
};