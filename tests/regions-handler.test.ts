import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { it, expect, vi } from "vitest";
import { normalizeEA20 } from "../src/lib/tse/normalizer";
import raw from "./ea20-sp-official.json" with { type: "json" };
import { resultUrl } from "../src/lib/tse/urls";
const activity = vi.hoisted(() => ({ active: 0, max: 0, calls: 0 }));
vi.mock("../server/collector.ts", () => ({
  Collector: class {
    constructor(
      _fetch: unknown,
      _format: unknown,
      _now: unknown,
      _cache: unknown,
      private scope: "sp",
    ) {}
    async get() {
      activity.calls++;
      activity.active++;
      activity.max = Math.max(activity.max, activity.active);
      await new Promise((r) => setTimeout(r, 5));
      activity.active--;
      return {
        result: normalizeEA20({ ...raw, cdabr: this.scope }, this.scope),
        verified: true,
        stale: false,
        checkedAt: new Date().toISOString(),
        sourceUrl: resultUrl("jws", this.scope),
      };
    }
  },
}));
import { regionsHandler } from "../server/regions-handler";
it("rejects arbitrary inputs and bounds regional concurrency", async () => {
  const server = createServer(regionsHandler);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  try {
    for (const path of [
      "",
      "?region=invalid",
      "?region=sul&region=norte",
      "?region=https://example.com",
    ])
      expect((await fetch(url + path)).status).toBe(400);
    expect(activity.calls).toBe(0);
    expect((await fetch(url + "?region=sul", { method: "POST" })).status).toBe(
      405,
    );
    const response = await fetch(url + "?region=nordeste");
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.states).toHaveLength(9);
    expect(body.verifiedSources).toBe(true);
    expect(activity.max).toBeLessThanOrEqual(3);
    expect(activity.calls).toBe(9);
    expect(response.headers.get("vercel-cdn-cache-control")).toContain(
      "s-maxage=5",
    );
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});
