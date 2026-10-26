// The SDK enqueues one complete SSE record per chunk. Recheck before relaying
// each record so an already open connection stops receiving after departure.
export function authorizedStream(source: ReadableStream<Uint8Array>, isMember: () => Promise<boolean>) {
  const reader = source.getReader();
  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const { done, value } = await reader.read();
        if (done) { controller.close(); return; }
        let destroyed = false;
        try {
          const payload = JSON.parse(new TextDecoder().decode(value).replace(/^data: /, '').trim());
          destroyed = payload.event === 'chat.destroy' && payload.data?.isDestroyed === true;
        } catch { /* Non-JSON control records still require membership. */ }
        if (!destroyed && !(await isMember())) { await reader.cancel(); controller.close(); return; }
        controller.enqueue(value);
      } catch (error) { await reader.cancel().catch(() => {}); controller.error(error); }
    },
    cancel(reason) { return reader.cancel(reason); },
  });
}
