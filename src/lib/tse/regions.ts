import { z } from "zod";
import {
  REGIONS,
  getRegion,
  type RegionCode,
  type UfCode,
} from "./geography.ts";
import { envelopeSchema, resultSchema } from "./schemas.ts";
import type { ElectionResult, ResultEnvelope } from "./types.ts";
export interface StateResult {
  code: UfCode;
  name: string;
  data?: ResultEnvelope;
  error?: string;
}
export const regionResponseSchema = z
  .object({
    region: z.enum([
      "norte",
      "nordeste",
      "centro-oeste",
      "sudeste",
      "sul",
      "exterior",
    ]),
    states: z.array(
      z.object({
        code: z.string(),
        name: z.string(),
        data: envelopeSchema.optional(),
        error: z.string().optional(),
      }),
    ),
    summary: resultSchema.nullable(),
    summaryUnavailableReason: z.string().nullable(),
    verifiedSources: z.boolean(),
    stale: z.boolean(),
    generatedFrom: z.string().nullable(),
    generatedTo: z.string().nullable(),
  })
  .superRefine((data, ctx) => {
    const expected = getRegion(data.region)!
      .states.map(([code]) => code)
      .sort();
    const actual = data.states.map((s) => s.code).sort();
    if (JSON.stringify(expected) !== JSON.stringify(actual))
      ctx.addIssue({ code: "custom", message: "Unexpected regional coverage" });
    if (
      data.summary &&
      data.states.some((s) => !s.data?.result.votingCanBeDisplayed)
    )
      ctx.addIssue({ code: "custom", message: "Incomplete regional summary" });
    if (data.verifiedSources && data.states.some((s) => !s.data?.verified))
      ctx.addIssue({ code: "custom", message: "Unverified regional source" });
  });
export type RegionResponse = z.infer<typeof regionResponseSchema>;
export function consolidateRegion(
  region: RegionCode,
  states: StateResult[],
): RegionResponse {
  const definition = getRegion(region)!;
  if (
    definition.states.length !== states.length ||
    definition.states.some(
      ([code]) => states.filter((s) => s.code === code).length !== 1,
    )
  )
    throw new Error("Unexpected regional coverage");
  const envelopes = states.flatMap((s) => (s.data ? [s.data] : []));
  const results = envelopes.map((d) => d.result);
  let summary: ElectionResult | null = null;
  let reason: string | null = null;
  if (results.length !== states.length)
    reason = "A consolidação aguarda todas as fontes deste recorte.";
  else if (results.some((r) => !r.votingCanBeDisplayed))
    reason =
      "A consolidação aguarda autorização de divulgação de todas as fontes.";
  else if (region === "exterior") summary = results[0];
  else {
    const sum = (get: (r: ElectionResult) => number) =>
      results.reduce((total, r) => total + get(r), 0);
    const ratio = (value: number, total: number) =>
      total === 0 ? 0 : Number(((value / total) * 100).toFixed(2));
    const candidates = results[0].candidates;
    const identities = (r: ElectionResult) =>
      r.candidates
        .map((c) => `${c.candidateId}:${c.number}:${c.sequence}`)
        .sort()
        .join("|");
    if (results.some((r) => identities(r) !== identities(results[0])))
      reason =
        "As fontes divergem na identificação dos candidatos; consulte as UFs individualmente.";
    else {
      const totalSections = sum((r) => r.progress.totalSections),
        countedSections = sum((r) => r.progress.countedSections);
      const turnout = sum((r) => r.electorate.turnout),
        abstentions = sum((r) => r.electorate.abstentions);
      const candidateVotes = sum((r) =>
        r.candidates.reduce((total, c) => total + c.votes, 0),
      );
      const generatedAt = results
        .map((r) => r.generatedAt)
        .sort((a, b) => Date.parse(a) - Date.parse(b))[0];
      const parsed = resultSchema.safeParse({
        source: "TSE",
        electionCode: "6258",
        generationId: states
          .map((s) => `${s.code}:${s.data!.result.generationId}`)
          .join("|"),
        generatedAt,
        status: results.every((r) => r.status === "final")
          ? "final"
          : results.every((r) => r.status === "not_started")
            ? "not_started"
            : "partial",
        mathematicallyDefined: "none",
        votingCanBeDisplayed: true,
        progress: {
          totalSections,
          countedSections,
          pendingSections: sum((r) => r.progress.pendingSections),
          countedPercent: ratio(countedSections, totalSections),
        },
        electorate: {
          total: sum((r) => r.electorate.total),
          turnout,
          abstentions,
          turnoutPercent: ratio(turnout, turnout + abstentions),
          abstentionPercent: ratio(abstentions, turnout + abstentions),
        },
        votes: {
          total: sum((r) => r.votes.total),
          valid: sum((r) => r.votes.valid),
          blank: sum((r) => r.votes.blank),
          null: sum((r) => r.votes.null),
        },
        candidates: candidates.map((c) => {
          const votes = sum(
            (r) =>
              r.candidates.find((other) => other.candidateId === c.candidateId)!
                .votes,
          );
          return {
            ...c,
            votes,
            percent: ratio(votes, candidateVotes),
            elected: false,
            status: null,
          };
        }),
        warnings: results.flatMap((r) => r.warnings),
      });
      if (parsed.success) summary = parsed.data;
      else
        reason =
          "Não foi possível consolidar os dados recebidos sem inconsistências.";
    }
  }
  const generations = results
    .map((r) => r.generatedAt)
    .sort((a, b) => Date.parse(a) - Date.parse(b));
  return regionResponseSchema.parse({
    region,
    states,
    summary,
    summaryUnavailableReason: reason,
    verifiedSources:
      envelopes.length === states.length && envelopes.every((d) => d.verified),
    stale: envelopes.length !== states.length || envelopes.some((d) => d.stale),
    generatedFrom: generations[0] ?? null,
    generatedTo: generations.at(-1) ?? null,
  });
}
export const REGION_CODES = REGIONS.map((r) => r.code);
