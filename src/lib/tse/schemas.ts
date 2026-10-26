import { z } from "zod";
export const integer = z
  .union([z.number(), z.string().regex(/^\d+$/)])
  .transform(Number)
  .pipe(z.number().int().nonnegative().safe());
export const decimal = z
  .union([z.number(), z.string().regex(/^\d+(?:[,.]\d+)?$/)])
  .transform((v) => Number(String(v).replace(",", ".")))
  .pipe(z.number().finite().min(0).max(100));
const candidate = z.object({
  n: integer,
  sqcand: z.string().regex(/^\d+$/),
  nm: z.string(),
  nmu: z.string(),
  seq: integer,
  e: z.string(),
  st: z.string().optional(),
  vap: integer,
  pvap: decimal,
});
export const ea20Schema = z.object({
  ele: z.literal("6258"),
  t: z.literal("2"),
  f: z.literal("o"),
  tpabr: z.literal("br"),
  cdabr: z.literal("br"),
  dg: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/),
  hg: z.string().regex(/^\d{2}:\d{2}:\d{2}$/),
  idg: z.string().min(1),
  dv: z.enum(["s", "n"]),
  tf: z.enum(["s", "n"]),
  and: z.enum(["n", "p", "f"]),
  md: z.enum(["n", "s", "e"]),
  carg: z.array(
    z.object({
      cd: z.string(),
      agr: z.array(
        z.object({
          par: z.array(z.object({ sg: z.string(), cand: z.array(candidate) })),
        }),
      ),
    }),
  ),
  s: z.object({
    ts: integer,
    st: integer,
    snt: integer,
    pst: decimal,
    si: integer.optional(),
    sni: integer.optional(),
  }),
  e: z.object({
    te: integer,
    c: integer,
    pc: decimal,
    a: integer,
    pa: decimal,
  }),
  v: z.object({ tv: integer, vv: integer, vb: integer, tvn: integer }),
});
export const resultSchema = z.object({
  source: z.literal("TSE"),
  electionCode: z.literal("6258"),
  generationId: z.string(),
  generatedAt: z.string().datetime({ offset: true }),
  status: z.enum(["not_started", "partial", "final"]),
  mathematicallyDefined: z.enum(["none", "second_round", "elected"]),
  votingCanBeDisplayed: z.boolean(),
  progress: z.object({
    totalSections: integer,
    countedSections: integer,
    pendingSections: integer,
    countedPercent: decimal,
    installedSections: integer.optional(),
    notInstalledSections: integer.optional(),
  }),
  electorate: z.object({
    total: integer,
    turnout: integer,
    turnoutPercent: decimal,
    abstentions: integer,
    abstentionPercent: decimal,
  }),
  votes: z.object({
    total: integer,
    valid: integer,
    blank: integer,
    null: integer,
  }),
  candidates: z.array(
    z.object({
      sequence: integer,
      number: integer,
      candidateId: z.string().regex(/^\d+$/),
      name: z.string(),
      ballotName: z.string(),
      party: z.string(),
      votes: integer,
      percent: decimal,
      elected: z.boolean(),
      status: z.string().nullable(),
      photoUrl: z.string().url(),
    }),
  ),
  warnings: z.array(z.string()),
});
export const envelopeSchema = z.object({
  result: resultSchema,
  verified: z.boolean(),
  stale: z.boolean(),
  checkedAt: z.string(),
  sourceUrl: z.string().url(),
  error: z.string().optional(),
});

