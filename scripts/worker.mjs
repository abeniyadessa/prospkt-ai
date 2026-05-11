const intervalMs = Number(process.env.AGENT_WORKER_INTERVAL_MS ?? 15 * 60 * 1000);
const appUrl =
  process.env.PROSPKT_APP_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  "http://localhost:3000";
const dryRun = process.env.AGENT_DRY_RUN !== "false";

let active = false;

async function request(path, init) {
  const response = await fetch(`${appUrl}${path}`, init);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${path} failed ${response.status}: ${text}`);
  }
  return response.json();
}

async function tick() {
  if (active) return;
  active = true;
  try {
    const result = await request("/api/agent/worker", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.CRON_SECRET ?? ""}`,
      },
      body: JSON.stringify({ dryRun }),
    });
    console.log("[agent-worker]", JSON.stringify(result));
  } catch (err) {
    console.error("[agent-worker]", err);
  } finally {
    active = false;
  }
}

console.log(`[agent-worker] watching ${appUrl} every ${Math.round(intervalMs / 1000)}s`);
void tick();
setInterval(tick, intervalMs);
