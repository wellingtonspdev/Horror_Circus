import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { it, expect, vi } from "vitest";
const get = vi.hoisted(() => vi.fn());
vi.mock("../server/collector.ts", () => ({
  Collector: class {
    get = get;
  },
}));
import { resultsHandler } from "../server/handler.ts";
it("caches only successful fresh responses at the Vercel CDN", async () => {
  const server = createServer(resultsHandler);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  try {
    get.mockResolvedValueOnce({ stale: false });
    const fresh = await fetch(url);
    expect(fresh.status).toBe(200);
    expect(fresh.headers.get("vercel-cdn-cache-control")).toBe(
      "s-maxage=5, stale-while-revalidate=5",
    );
    get.mockResolvedValueOnce({ stale: true });
    const stale = await fetch(url);
    expect(stale.headers.get("cache-control")).toBe("no-store");
    expect(stale.headers.get("vercel-cdn-cache-control")).toBeNull();
    get.mockRejectedValueOnce(new Error("offline"));
    const error = await fetch(url);
    expect(error.status).toBe(503);
    expect(error.headers.get("cache-control")).toBe("no-store");
    const method = await fetch(url, { method: "POST" });
    expect(method.status).toBe(405);
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});
