// A cancelled navigation must not disconnect the room. pagehide only fires
// when the document actually leaves, unlike beforeunload. Effect cleanup is
// intentionally not a departure (React Strict Mode performs extra cleanups).
export function watchRoomPageLifecycle(
  onDisconnect: () => void,
  onRestore: () => void,
  target: Pick<Window, "addEventListener" | "removeEventListener"> = window,
) {
  let disconnected = false;
  const onPageHide = () => {
    if (disconnected) return;
    disconnected = true;
    onDisconnect();
  };
  const onPageShow = (event: Event) => {
    if ((event as PageTransitionEvent).persisted) onRestore();
  };
  target.addEventListener("pagehide", onPageHide);
  target.addEventListener("pageshow", onPageShow);
  return () => {
    target.removeEventListener("pagehide", onPageHide);
    target.removeEventListener("pageshow", onPageShow);
  };
}
