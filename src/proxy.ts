import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { roomPresence } from "./lib/rooms";
export const proxy = async (req: NextRequest) => {
 const roomId=req.nextUrl.pathname.match(/^\/room\/([^/]+)$/)?.[1];
 if (!roomId) return NextResponse.redirect(new URL("/",req.url));
 const token=req.cookies.get("x-auth-token")?.value || nanoid();
 const [count]=await roomPresence(roomId,token,"admit");
 if (count<0) return NextResponse.redirect(new URL(count===-2?"/?error=room-full":"/?error=room-not-found",req.url));
 const response=NextResponse.next();
 response.cookies.set("x-auth-token",token,{path:"/",httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"strict"});
 return response;
};
export const config={matcher:"/room/:path*"};
