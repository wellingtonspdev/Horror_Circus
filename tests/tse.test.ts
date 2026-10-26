import { describe, it, expect, vi } from "vitest";
import { generateKeyPair, exportJWK, CompactSign } from "jose";
import raw from "./ea20-official.json" with { type: "json" };
import {
  normalizeEA20,
  parseTseDecimal,
  parseTseInteger,
} from "../src/lib/tse/normalizer";
import { ea20Schema } from "../src/lib/tse/schemas";
import { verifyJws } from "../src/lib/tse/jws";
import { Collector, discoverElection } from "../server/collector";
describe("EA20 boundary", () => {
  it("parses strict integers and Brazilian percentages", () => {
    expect(parseTseDecimal("50,49")).toBe(50.49);
    expect(parseTseInteger("123456")).toBe(123456);
    for (const v of ["", null, "1e3", "1.234", "-1"])
      expect(() => parseTseInteger(v)).toThrow();
    expect(() => parseTseDecimal("101")).toThrow();
  });
  it("rejects unexpected election, phase, malformed data", () => {
    expect(ea20Schema.safeParse({}).success).toBe(false);
    expect(() => normalizeEA20({ ...raw, f: "s" })).toThrow();
    expect(() => normalizeEA20({ ...raw, ele: "6257" })).toThrow();
  });
  it("maps candidates, fixed official order, photos and official percentages", () => {
    const d = normalizeEA20(raw);
    expect(d.candidates.map((c) => c.sequence)).toEqual([1, 2]);
    expect(d.candidates[0].candidateId).toBe("280002542548");
    expect(d.candidates[0].photoUrl).toContain("/280002542548.jpeg");
    expect(d.candidates[0].votes).toBe(
      Number(raw.carg[0].agr[1].par[0].cand[0].vap),
    );
    expect(d.progress.countedPercent).toBe(parseTseDecimal(raw.s.pst));
  });
  it("does not infer final or mathematical definition from percent", () => {
    expect(
      normalizeEA20({ ...raw, s: { ...raw.s, pst: "100,00" } }).status,
    ).toBe("partial");
    expect(normalizeEA20({ ...raw, md: "e" }).mathematicallyDefined).toBe(
      "elected",
    );
    expect(normalizeEA20({ ...raw, md: "s" }).mathematicallyDefined).toBe(
      "second_round",
    );
    expect(normalizeEA20({ ...raw, tf: "s" }).status).toBe("final");
  });
  it("gates voting at domain boundary", () => {
    const r = normalizeEA20({ ...raw, dv: "n", md: "e" });
    expect(r.candidates).toEqual([]);
    expect(r.votes.total).toBe(0);
    expect(r.mathematicallyDefined).toBe("none");
  });
  it("preserves section inconsistencies with warning", () => {
    const r = normalizeEA20({ ...raw, s: { ...raw.s, snt: "1" } });
    expect(r.progress.pendingSections).toBe(1);
    expect(r.warnings).toHaveLength(1);
  });
  it("generation ids can decrease", () => {
    const a = normalizeEA20({ ...raw, idg: "9999" }),
      b = normalizeEA20({ ...raw, idg: "1" });
    expect(a.generationId !== b.generationId).toBe(true);
  });
});
describe("JWS", () => {
  it("verifies actual Ed25519 signatures, rejects wrong kid, wrong key and tampering", async () => {
    const { privateKey, publicKey } = await generateKeyPair("EdDSA");
    const jwk = { ...(await exportJWK(publicKey)), kid: "test-key" };
    const sign = (kid: string) =>
      new CompactSign(new TextEncoder().encode(JSON.stringify(raw)))
        .setProtectedHeader({ alg: "EdDSA", kid })
        .sign(privateKey);
    const signed = await sign("test-key");
    expect(await verifyJws(signed, jwk)).toEqual(raw);
    await expect(verifyJws(await sign("wrong-key"), jwk)).rejects.toThrow();
    await expect(verifyJws(signed.replace(/.$/, "!"), jwk)).rejects.toThrow();
    await expect(verifyJws(signed)).rejects.toThrow();
  });
});
const catalog = {
  f: "o",
  pl: [
    {
      c: "ele2026",
      e: [
        { cd: "6258", t: "2", tp: "8", abr: [{ cd: "br", cp: [{ cd: "1" }] }] },
      ],
    },
  ],
};
describe("collector", () => {
  it("shares last-known-good, ETag and cooldown across cold instances", async () => {
    let now = 0;
    const values = new Map<string, unknown>();
    const cache = {
      get: async (key: string) => values.get(key),
      set: async (key: string, value: unknown) => {
        values.set(key, value);
      },
    };
    const firstFetch = vi
      .fn()
      .mockResolvedValueOnce(Response.json(catalog))
      .mockResolvedValueOnce(
        Response.json(raw, { headers: { etag: "shared-etag" } }),
      );
    const initial = await new Collector(
      firstFetch,
      "json",
      () => now,
      cache,
    ).get();
    const secondFetch = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 304 }));
    const cold = new Collector(secondFetch, "json", () => now, cache);
    expect(await cold.get()).toEqual(initial);
    expect(secondFetch).not.toHaveBeenCalled();
    now = 5001;
    expect((await cold.get()).stale).toBe(false);
    expect(secondFetch.mock.calls[0][1].headers["If-None-Match"]).toBe(
      "shared-etag",
    );
    now = 10002;
    const offline = vi.fn().mockRejectedValue(new Error("offline"));
    const fallback = await new Collector(
      offline,
      "json",
      () => now,
      cache,
    ).get();
    expect(fallback.stale).toBe(true);
    expect(fallback.result).toEqual(initial.result);
    const retry = vi.fn();
    expect(
      (await new Collector(retry, "json", () => now, cache).get()).stale,
    ).toBe(true);
    expect(retry).not.toHaveBeenCalled();
  });
  it("rejects invalid shared cache and remains available when cache service fails", async () => {
    const cache = {
      get: async () => ({ last: { verified: true } }),
      set: async () => {
        throw new Error("cache offline");
      },
    };
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(Response.json(catalog))
      .mockResolvedValueOnce(Response.json(raw));
    expect(
      (await new Collector(fetcher, "json", () => 0, cache).get()).result
        .generationId,
    ).toBe(raw.idg);
  });
  it("distinguishes signature failure from network failure", async () => {
    const signatureFetch = vi
      .fn()
      .mockResolvedValueOnce(Response.json(catalog))
      .mockResolvedValueOnce(new Response("invalid-jws"));
    await expect(new Collector(signatureFetch, "jws").get()).rejects.toThrow(
      "Assinatura oficial inválida",
    );
    const networkFetch = vi
      .fn()
      .mockResolvedValueOnce(Response.json(catalog))
      .mockRejectedValueOnce(new Error("offline"));
    await expect(new Collector(networkFetch, "jws").get()).rejects.toThrow(
      "temporariamente indisponível",
    );
  });
  it("backs off 5, 10, 20, 30 seconds and resets after a valid result", async () => {
    let now = 0;
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(Response.json(catalog))
      .mockImplementation(async () => new Response(null, { status: 503 }));
    const c = new Collector(fetcher, "json", () => now);
    for (const delay of [5000, 10000, 20000, 30000]) {
      await expect(c.get()).rejects.toThrow();
      const calls = fetcher.mock.calls.length;
      now += delay - 1;
      await expect(c.get()).rejects.toThrow();
      expect(fetcher).toHaveBeenCalledTimes(calls);
      now += 2;
    }
    fetcher.mockResolvedValueOnce(Response.json(raw));
    await expect(c.get()).resolves.toHaveProperty("stale", false);
    const calls = fetcher.mock.calls.length;
    now += 4999;
    await c.get();
    expect(fetcher).toHaveBeenCalledTimes(calls);
  });
  it("discovers only federal national president second round", () => {
    expect(discoverElection(catalog)).toBe(true);
    expect(discoverElection({ ...catalog, pl: [] })).toBe(false);
  });
  it("caches, coalesces requests, handles 304 and keeps last-known-good on invalid payload", async () => {
    let now = 0;
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(Response.json(catalog))
      .mockResolvedValueOnce(Response.json(raw, { headers: { etag: "abc" } }))
      .mockResolvedValueOnce(new Response(null, { status: 304 }))
      .mockResolvedValueOnce(Response.json({ bad: true }));
    const collector = new Collector(fetcher, "json", () => now);
    const [a, b] = await Promise.all([collector.get(), collector.get()]);
    expect(a).toEqual(b);
    expect(fetcher).toHaveBeenCalledTimes(2);
    await collector.get();
    expect(fetcher).toHaveBeenCalledTimes(2);
    now = 5001;
    const unchanged = await collector.get();
    expect(unchanged.stale).toBe(false);
    expect(fetcher.mock.calls[2][1].headers["If-None-Match"]).toBe("abc");
    now = 10002;
    const fallback = await collector.get();
    expect(fallback.stale).toBe(true);
    expect(fallback.result).toEqual(a.result);
  });
  it("backs off without a snapshot and never substitutes a fixture", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(Response.json(catalog))
      .mockResolvedValue(new Response(null, { status: 404 }));
    const collector = new Collector(fetcher, "json", () => 0);
    await expect(collector.get()).rejects.toThrow();
    await expect(collector.get()).rejects.toThrow();
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});
