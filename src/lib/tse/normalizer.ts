import { ea20Schema, integer, decimal, resultSchema } from "./schemas.ts";
import { photoUrl } from "./urls.ts";
import { isTseScope, type TseScope } from "./geography.ts";
export const parseTseInteger = (v: unknown) => integer.parse(v);
export const parseTseDecimal = (v: unknown) => decimal.parse(v);
export function normalizeEA20(payload: unknown, scope: TseScope = "br") {
  const d = ea20Schema.parse(payload);
  if (
    !isTseScope(scope) ||
    d.cdabr !== scope ||
    d.tpabr !== (scope === "br" ? "br" : "uf")
  )
    throw new Error("Unexpected TSE geographic scope");
  const [day, month, year] = d.dg.split("/");
  const candidates = d.carg
    .filter((c) => c.cd === "1")
    .flatMap((c) =>
      c.agr.flatMap((a) =>
        a.par.flatMap((p) =>
          p.cand.map((c) => ({
            sequence: c.seq,
            number: c.n,
            candidateId: c.sqcand,
            name: c.nm,
            ballotName: c.nmu,
            party: p.sg,
            votes: c.vap,
            percent: c.pvap,
            elected: scope === "br" && c.e === "s",
            status: scope === "br" ? c.st || null : null,
            photoUrl: photoUrl(c.sqcand),
          })),
        ),
      ),
    )
    .sort((a, b) => a.sequence - b.sequence);
  const visible = d.dv === "s";
  return resultSchema.parse({
    source: "TSE",
    electionCode: d.ele,
    generationId: d.idg,
    generatedAt: `${year}-${month}-${day}T${d.hg}-03:00`,
    status: d.tf === "s" ? "final" : d.and === "n" ? "not_started" : "partial",
    mathematicallyDefined:
      visible && scope === "br"
        ? d.md === "e"
          ? "elected"
          : d.md === "s"
            ? "second_round"
            : "none"
        : "none",
    votingCanBeDisplayed: visible,
    progress: {
      totalSections: d.s.ts,
      countedSections: d.s.st,
      pendingSections: d.s.snt,
      countedPercent: d.s.pst,
      installedSections: d.s.si,
      notInstalledSections: d.s.sni,
    },
    electorate: {
      total: d.e.te,
      turnout: d.e.c,
      turnoutPercent: d.e.pc,
      abstentions: d.e.a,
      abstentionPercent: d.e.pa,
    },
    votes: visible
      ? { total: d.v.tv, valid: d.v.vv, blank: d.v.vb, null: d.v.tvn }
      : { total: 0, valid: 0, blank: 0, null: 0 },
    candidates: visible ? candidates : [],
    warnings:
      d.s.st + d.s.snt !== d.s.ts
        ? ["A soma das seções diverge do total informado pelo TSE."]
        : [],
  });
}
