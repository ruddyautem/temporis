interface ClipboardContext {
  origin: string;
  clipboard: Pick<Clipboard, "writeText">;
  storage?: Pick<Storage, "setItem">;
}
const copiedKey = (roomId: string) => `temporis_invite_copied_${roomId}`;

export async function copyRoomInviteLink(roomId: string, fragment: string, context?: ClipboardContext) {
  try {
    const origin = context?.origin ?? window.location.origin;
    const clipboard = context?.clipboard ?? navigator.clipboard;
    await clipboard.writeText(`${origin}/join/${roomId}${fragment}`);
  } catch { return false; }
  try { (context ? context.storage : window.sessionStorage)?.setItem(copiedKey(roomId), "true"); } catch {}
  return true;
}

export function hasCopiedRoomInvite(roomId: string) {
  try { return sessionStorage.getItem(copiedKey(roomId)) === "true"; } catch { return false; }
}
