import { emitter } from "@/lib/events";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const encoder = new TextEncoder();
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  let onUpdate: ((data: any) => void) | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: string, data: any) => {
        try {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
          );
        } catch {
          cleanup();
        }
      };

      onUpdate = (data: any) => {
        send("tokens.updated", data);
      };

      emitter.on("tokens.updated", onUpdate);

      send("connected", { time: Date.now() });

      heartbeatTimer = setInterval(() => {
        send("heartbeat", { time: Date.now() });
      }, 30_000);
    },
    cancel() {
      cleanup();
    },
  });

  function cleanup() {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
    if (onUpdate) {
      emitter.off("tokens.updated", onUpdate);
      onUpdate = null;
    }
  }

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
