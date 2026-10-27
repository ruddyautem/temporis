import { PRESENCE_HEARTBEAT_MS } from "./room-presence-config";

// A live stream maintains its document's lease even when background-tab timers
// are throttled. Generation checks prevent an outgoing stream from reviving it.
export function authorizedStream(
  source: ReadableStream<Uint8Array>,
  isMember: () => Promise<boolean>,
  renew?: () => Promise<boolean>,
) {
  const reader = source.getReader();
  let closed = false;
  let renewing = false;
  let timer: ReturnType<typeof setInterval> | undefined;
  const stop = () => { closed = true; clearInterval(timer); };
  return new ReadableStream<Uint8Array>({
    start(controller) {
      if (!renew) return;
      timer = setInterval(async () => {
        if (closed || renewing) return;
        renewing = true;
        try {
          if (!(await renew()) && !closed) {
            stop();
            controller.close();
            await reader.cancel();
          }
        } catch {
          // A transient Redis failure cannot extend the lease. The next tick
          // must still pass authorization, otherwise the stream closes.
        } finally { renewing = false; }
      }, PRESENCE_HEARTBEAT_MS);
    },
    async pull(controller) {
      try {
        const { done, value } = await reader.read();
        if (closed) return;
        if (done) { stop(); controller.close(); return; }
        let destroyed = false;
        try {
          const payload = JSON.parse(new TextDecoder().decode(value).replace(/^data: /, "").trim());
          destroyed = payload.event === "chat.destroy" && payload.data?.isDestroyed === true;
        } catch { /* Control records still require membership. */ }
        if (!destroyed && !(await isMember())) {
          if (closed) return;
          stop(); controller.close(); await reader.cancel(); return;
        }
        if (!closed) controller.enqueue(value);
      } catch (error) {
        if (closed) return;
        stop(); controller.error(error); await reader.cancel().catch(() => {});
      }
    },
    cancel(reason) { stop(); return reader.cancel(reason); },
  });
}
