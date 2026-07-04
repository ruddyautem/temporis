import { NextRequest, NextResponse } from "next/server";
import { redis } from "./lib/redis";
import { nanoid } from "nanoid";

export const proxy = async (req: NextRequest) => {
  const pathname = req.nextUrl.pathname;

  const roomMatch = pathname.match(/^\/room\/([^/]+)$/);
  if (!roomMatch) return NextResponse.redirect(new URL("/", req.url));

  const roomId = roomMatch[1];

  const metaKey = `meta:${roomId}`;
  const meta = await redis.hgetall<{ connected: string[]; createdAt: number }>(
    metaKey,
  );

  if (!meta)
    return NextResponse.redirect(new URL("/?error=room-not-found", req.url));

  const existingToken = req.cookies.get("x-auth-token")?.value;

  // USER IS ALLOWED TO JOIN ROOM
  if (existingToken && meta.connected.includes(existingToken)) {
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

  // Update connected list
  await redis.hset(metaKey, { connected: [...meta.connected, token] });

  // Re-apply the TTL (critical!)
  if (remaining > 0) {
    await redis.expire(metaKey, remaining);
  }

  return response;
};

export const config = {
  matcher: "/room/:path*",
};