let started = false;

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" && !started) {
    started = true;
    const { startPoller } = await import("./lib/poller");
    startPoller();
  }
}
