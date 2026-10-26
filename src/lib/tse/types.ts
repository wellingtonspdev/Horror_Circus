import type { z } from "zod";
import type { resultSchema, envelopeSchema } from "./schemas.ts";
export type ElectionResult = z.infer<typeof resultSchema>;
export type ResultEnvelope = z.infer<typeof envelopeSchema>;
export type CandidateResult = ElectionResult["candidates"][number];

