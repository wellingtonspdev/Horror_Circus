import { envelopeSchema, resultSchema } from "./schemas.ts";
import { resultUrl } from "./urls.ts";
import fixture from "../../../astro-change-package/fixtures/normalized-president-2026-snapshot.json" with { type: "json" };
import { z } from "zod";
let failures = 0;
export const pollingDelay = () =>
  Math.min(5000 * 2 ** Math.max(failures - 1, 0), 30000);
export const fixtureMode = import.meta.env.VITE_DATA_MODE === "fixture";
export function fixtureResult() {
  return resultSchema.parse({
    source: "TSE",
    electionCode: fixture.election.code,
    generationId: fixture.election.generationId,
    generatedAt: "2026-10-25T19:58:07-03:00",
    status: fixture.election.status,
    mathematicallyDefined: "none",
    votingCanBeDisplayed: true,
    progress: {
      totalSections: fixture.progress.sectionsTotal,
      countedSections: fixture.progress.sectionsCounted,
      pendingSections: fixture.progress.sectionsPending,
      countedPercent: fixture.progress.percentCounted,
    },
    electorate: {
      total: fixture.turnout.eligibleVoters,
      turnout: fixture.turnout.turnout,
      turnoutPercent: fixture.turnout.turnoutPercent,
      abstentions: fixture.turnout.abstentions,
      abstentionPercent: fixture.turnout.abstentionPercent,
    },
    votes: fixture.votes,
    candidates: fixture.candidates.map((c, index) => ({
      ...c,
      sequence: index + 1,
      name: c.fullName,
      status: null,
    })),
    warnings: [
      "Fixture de desenvolvimento; ordem preservada do arquivo, sem seq oficial.",
    ],
  });
}
export async function fetchResults() {
  if (fixtureMode)
    return envelopeSchema.parse({
      result: fixtureResult(),
      verified: false,
      stale: false,
      checkedAt: new Date().toISOString(),
      sourceUrl: resultUrl(),
    });
  try {
    const response = await fetch("/api/results", {
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) {
      const body = z
        .object({ error: z.string().max(250) })
        .safeParse(await response.json());
      throw new Error(
        body.success
          ? body.data.error
          : "Não foi possível obter os resultados oficiais neste momento.",
      );
    }
    const data = envelopeSchema.parse(await response.json());
    failures = data.stale ? failures + 1 : 0;
    return data;
  } catch (error) {
    failures++;
    throw error;
  }
}
