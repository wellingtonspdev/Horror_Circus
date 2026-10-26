import { describe, it, expect, vi } from "vitest";
import sp from "./ea20-sp-official.json" with { type: "json" };
import ba from "./ea20-ba-official.json" with { type: "json" };
import zz from "./ea20-zz-official.json" with { type: "json" };
import { normalizeEA20 } from "../src/lib/tse/normalizer";
import {
  REGIONS,
  getRegion,
  type RegionCode,
  type UfCode,
} from "../src/lib/tse/geography";
import {
  consolidateRegion,
  regionResponseSchema,
  type StateResult,
} from "../src/lib/tse/regions";
import { resultUrl } from "../src/lib/tse/urls";
import { Collector } from "../server/collector";
export function stateFixtures(region: RegionCode): StateResult[] {
  return getRegion(region)!.states.map(([code, name]) => ({
    code,
    name,
    data: {
      result: normalizeEA20({ ...sp, cdabr: code }, code),
      verified: true,
      stale: false,
      checkedAt: new Date().toISOString(),
      sourceUrl: resultUrl("jws", code),
    },
  }));
}
describe("geographic boundary", () => {
  it("covers each of the 27 UFs once, with exterior separate", () => {
    const codes = REGIONS.slice(0, 5).flatMap((r) =>
      r.states.map(([code]) => code),
    );
    expect(codes).toHaveLength(27);
    expect(new Set(codes).size).toBe(27);
    expect(getRegion("exterior")!.states).toEqual([["zz", "Exterior"]]);
  });
  it("validates actual state payloads and rejects geographic substitution", () => {
    expect(normalizeEA20(sp, "sp").progress.countedPercent).toBe(
      Number(sp.s.pst.replace(",", ".")),
    );
    expect(normalizeEA20(ba, "ba").candidates.map((c) => c.sequence)).toEqual([
      1, 2,
    ]);
    expect(() => normalizeEA20(sp)).toThrow("scope");
    expect(() => normalizeEA20(sp, "ba")).toThrow("scope");
    expect(() => normalizeEA20({ ...sp, tpabr: "br" }, "sp")).toThrow("scope");
    expect(() => resultUrl("jws", "../sp" as UfCode)).toThrow();
  });
  it("never declares presidential election defined from UF data", () => {
    const d = normalizeEA20(
      {
        ...sp,
        md: "e",
        carg: sp.carg.map((c) => ({
          ...c,
          agr: c.agr.map((g) => ({
            ...g,
            par: g.par.map((p) => ({
              ...p,
              cand: p.cand.map((x) => ({ ...x, e: "s", st: "Eleito" })),
            })),
          })),
        })),
      },
      "sp",
    );
    expect(d.mathematicallyDefined).toBe("none");
    expect(d.candidates.every((c) => !c.elected && c.status === null)).toBe(
      true,
    );
  });
  it("isolates collector scope, shared cache, conditional requests and fallback", async () => {
    const values = new Map<string, unknown>();
    const cache = {
      get: async (k: string) => values.get(k),
      set: async (k: string, v: unknown) => {
        values.set(k, v);
      },
    };
    const rawCatalog = {
      f: "o",
      pl: [
        {
          c: "ele2026",
          e: [
            {
              cd: "6258",
              t: "2",
              tp: "8",
              abr: [{ cd: "br", cp: [{ cd: "1" }] }],
            },
          ],
        },
      ],
    };
    const a = vi
      .fn()
      .mockResolvedValueOnce(Response.json(rawCatalog))
      .mockResolvedValueOnce(Response.json(sp));
    await new Collector(a, "json", () => 0, cache, "sp").get();
    const b = vi
      .fn()
      .mockResolvedValueOnce(Response.json(rawCatalog))
      .mockResolvedValueOnce(Response.json(ba));
    const d = await new Collector(b, "json", () => 0, cache, "ba").get();
    expect(d.sourceUrl).toContain("/ba/ba-");
    expect(b).toHaveBeenCalledTimes(2);
    expect(values.size).toBe(2);
  });
});
describe("regional consolidation", () => {
  it("sums counts and calculates weighted percentages, never average of state percentages", () => {
    const states = stateFixtures("sul");
    const votes = [
      [1, 9],
      [80, 20],
      [450, 450],
    ];
    states.forEach((s, i) => {
      const r = s.data!.result;
      r.candidates.forEach((c, j) => {
        c.votes = votes[i][j];
        c.percent = i === 0 ? 99 : 1;
      });
      r.progress.totalSections = [10, 100, 1000][i];
      r.progress.countedSections = [1, 50, 900][i];
      r.progress.pendingSections =
        r.progress.totalSections - r.progress.countedSections;
    });
    const d = consolidateRegion("sul", states);
    expect(d.summary!.candidates[0].votes).toBe(531);
    expect(d.summary!.candidates[0].percent).toBe(52.57);
    expect(d.summary!.progress.totalSections).toBe(1110);
    expect(d.summary!.progress.countedPercent).toBe(85.68);
    expect(d.summary!.mathematicallyDefined).toBe("none");
  });
  it("keeps exterior official percentages exactly", () => {
    const data = {
      result: normalizeEA20(zz, "zz"),
      verified: true,
      stale: false,
      checkedAt: new Date().toISOString(),
      sourceUrl: resultUrl("jws", "zz"),
    };
    expect(
      consolidateRegion("exterior", [{ code: "zz", name: "Exterior", data }])
        .summary,
    ).toEqual(data.result);
  });
  it("does not present missing states or restricted voting as complete totals", () => {
    const missing = stateFixtures("sul");
    delete missing[0].data;
    const d = consolidateRegion("sul", missing);
    expect(d.summary).toBeNull();
    expect(d.stale).toBe(true);
    expect(d.verifiedSources).toBe(false);
    const gated = stateFixtures("sul");
    gated[0].data!.result.votingCanBeDisplayed = false;
    expect(consolidateRegion("sul", gated).summary).toBeNull();
  });
  it("keeps last-known-good sources labelled stale and does not claim unsigned verification", () => {
    const states = stateFixtures("sudeste");
    states[0].data!.stale = true;
    states[1].data!.verified = false;
    const d = consolidateRegion("sudeste", states);
    expect(d.summary).not.toBeNull();
    expect(d.stale).toBe(true);
    expect(d.verifiedSources).toBe(false);
  });
  it("rejects duplicate or wrong coverage and inconsistent candidate identities", () => {
    const states = stateFixtures("sul");
    expect(() =>
      consolidateRegion("sul", [states[0], states[0], states[2]]),
    ).toThrow("coverage");
    states[0].data!.result.candidates[0].candidateId = "999";
    expect(consolidateRegion("sul", states).summary).toBeNull();
    const d = consolidateRegion("sudeste", stateFixtures("sudeste"));
    expect(
      regionResponseSchema.safeParse({ ...d, region: "norte" }).success,
    ).toBe(false);
  });
  it("handles zero votes without NaN and uses all generation IDs regardless of numeric order", () => {
    const states = stateFixtures("sul");
    states.forEach((s, i) => {
      s.data!.result.candidates.forEach((c) => {
        c.votes = 0;
      });
      s.data!.result.generationId = String(9 - i);
    });
    const d = consolidateRegion("sul", states);
    expect(d.summary!.candidates.every((c) => c.percent === 0)).toBe(true);
    expect(d.summary!.generationId).toBe("pr:9|rs:8|sc:7");
  });
});
