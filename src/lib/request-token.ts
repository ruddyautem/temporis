export function roomToken(request: Pick<Request, "headers">): string | undefined {
  // Read the incoming headers directly. Reconstructing a NextRequest from the
  // request proxy provided by Next.js fails Node's native Request brand check.
  const cookie = request.headers.get("cookie") || "";
  return cookie.match(/(?:^|;\s*)x-auth-token=([\w-]{21})(?:;|$)/)?.[1];
}
