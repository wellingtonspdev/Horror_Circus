import { z } from "zod";
import { normalizeEA20 } from "../src/lib/tse/normalizer.ts";
import { verifyJws, SignatureError } from "../src/lib/tse/jws.ts";
import { CATALOG, resultUrl } from "../src/lib/tse/urls.ts";
import type { ResultEnvelope } from "../src/lib/tse/types.ts";
import { envelopeSchema } from "../src/lib/tse/schemas.ts";
export interface CollectorCache {
  get(key: string): Promise<unknown>;
  set(key: string, value: unknown, options: { ttl: number }): Promise<unknown>;
}
const cacheStateSchema = z.object({
  next: z.number().nonnegative(),
  failures: z.number().int().nonnegative(),
  discovered: z.boolean(),
  last: envelopeSchema.optional(),
  etag: z.string().optional(),
  modified: z.string().optional(),
});
const catalogSchema = z.object({
  f: z.literal("o"),
  pl: z.array(
    z.object({
      c: z.string(),
      e: z.array(
        z.object({
          cd: z.string(),
          t: z.string(),
          tp: z.string(),
          abr: z.array(
            z.object({
              cd: z.string(),
              cp: z.array(z.object({ cd: z.string() })),
            }),
          ),
        }),
      ),
    }),
  ),
});
export function discoverElection(raw: unknown) {
  const d = catalogSchema.parse(raw);
  return d.pl.some(
    (p) =>
      p.c === "ele2026" &&
      p.e.some(
        (e) =>
          e.cd === "6258" &&
          e.t === "2" &&
          e.tp === "8" &&
          e.abr.some((a) => a.cd === "br" && a.cp.some((c) => c.cd === "1")),
      ),
  );
}
export class Collector {
  private last?: ResultEnvelope;
  private etag?: string;
  private modified?: string;
  private next = 0;
  private failures = 0;
  private pending?: Promise<ResultEnvelope>;
  private discovered = false;
  constructor(
    private fetcher: typeof fetch = fetch,
    private format = "json",
    private now = () => Date.now(),
    private cache?: CollectorCache,
  ) {}
  async get() {
    if (this.pending) return this.pending;
    if (this.now() < this.next) {
      if (this.last) return this.last;
      throw new Error("Reconectando ao TSE");
    }
    this.pending = this.refresh().finally(() => {
      this.pending = undefined;
    });
    return this.pending;
  }
  private async refresh(): Promise<ResultEnvelope> {
    const key = `president-6258-v1-${this.format}`;
    if (this.cache) {
      try {
        const stored = cacheStateSchema.safeParse(await this.cache.get(key));
        if (
          stored.success &&
          stored.data.next > this.next &&
          stored.data.next <= this.now() + 65000
        ) {
          const state = stored.data;
          if (
            state.last &&
            (state.last.sourceUrl !== resultUrl(this.format) ||
              (this.format === "jws" && !state.last.verified))
          )
            throw new Error("Unexpected cached source");
          this.last = state.last;
          this.next = state.next;
          this.failures = state.failures;
          this.discovered = state.discovered;
          this.etag = state.etag;
          this.modified = state.modified;
          console.info(
            JSON.stringify({
              event: "tse-runtime-cache-restore",
              idg: this.last?.result.generationId,
              verified: this.last?.verified,
            }),
          );
        }
      } catch {
        console.warn("Runtime cache read unavailable; using process cache");
      }
    }
    if (this.now() < this.next) {
      if (this.last) return this.last;
      throw new Error("Reconectando ao TSE");
    }
    try {
      return await this.collect();
    } finally {
      if (this.cache) {
        try {
          await this.cache.set(
            key,
            {
              next: this.next,
              failures: this.failures,
              discovered: this.discovered,
              last: this.last,
              etag: this.etag,
              modified: this.modified,
            },
            { ttl: 86400 },
          );
        } catch {
          console.warn("Runtime cache write unavailable; using process cache");
        }
      }
    }
  }
  private async collect(): Promise<ResultEnvelope> {
    const started = this.now();
    const url = resultUrl(this.format);
    try {
      if (!this.discovered) {
        try {
          const r = await this.fetcher(CATALOG, {
            signal: AbortSignal.timeout(8000),
          });
          if (!r.ok || !discoverElection(await r.json()))
            throw new Error("EA11 sem eleição esperada");
          this.discovered = true;
        } catch {
          console.warn(
            "EA11 indisponível; fallback fixo 6258, validado pelo contrato EA20",
          );
        }
      }
      const headers: Record<string, string> = {
        accept: this.format === "jws" ? "application/jose" : "application/json",
      };
      if (this.etag) headers["If-None-Match"] = this.etag;
      if (this.modified) headers["If-Modified-Since"] = this.modified;
      const response = await this.fetcher(url, {
        headers,
        signal: AbortSignal.timeout(10000),
      });
      if (response.status === 304 && this.last) {
        this.last = {
          ...this.last,
          stale: false,
          error: undefined,
          checkedAt: new Date(this.now()).toISOString(),
        };
      } else {
        if (!response.ok) throw new Error(`TSE HTTP ${response.status}`);
        const text = await response.text();
        if (text.length > 2_000_000)
          throw new Error("TSE payload exceeds size limit");
        const payload =
          this.format === "jws" ? await verifyJws(text) : JSON.parse(text);
        const result = normalizeEA20(payload);
        this.last = {
          result,
          verified: this.format === "jws",
          stale: false,
          checkedAt: new Date(this.now()).toISOString(),
          sourceUrl: url,
        };
        this.etag = response.headers.get("etag") ?? undefined;
        this.modified = response.headers.get("last-modified") ?? undefined;
      }
      this.failures = 0;
      this.next = this.now() + 5000;
      console.info(
        JSON.stringify({
          event: "tse-check",
          http: response.status,
          latencyMs: this.now() - started,
          idg: this.last!.result.generationId,
          generatedAt: this.last!.result.generatedAt,
          verified: this.last!.verified,
        }),
      );
      return this.last!;
    } catch (error) {
      this.failures++;
      this.next = this.now() + Math.min(5000 * 2 ** (this.failures - 1), 30000);
      if (error instanceof Error && error.message.includes("404")) {
        this.next = this.now() + 60000;
        this.discovered = false;
      }
      const message =
        error instanceof SignatureError
          ? error.message
          : "Atualização oficial temporariamente indisponível.";
      console.warn(
        JSON.stringify({
          event: "tse-error",
          error: error instanceof Error ? error.message : "Unknown error",
          fallback: !!this.last,
        }),
      );
      if (!this.last) throw new Error(message, { cause: error });
      this.last = { ...this.last, stale: true, error: message };
      return this.last;
    }
  }
}
