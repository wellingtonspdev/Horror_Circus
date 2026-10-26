import type { IncomingMessage, ServerResponse } from "node:http";
import { getCache } from "@vercel/functions";
import { Collector } from "./collector.ts";
import { getRegion, type UfCode } from "../src/lib/tse/geography.ts";
import { consolidateRegion, type StateResult } from "../src/lib/tse/regions.ts";
const collectors = new Map<UfCode, Collector>();
function getCollector(scope: UfCode) {
  let collector = collectors.get(scope);
  if (!collector) {
    collector = new Collector(
      fetch,
      process.env.TSE_FORMAT === "json" ? "json" : "jws",
      () => Date.now(),
      process.env.VERCEL === "1"
        ? getCache({
            namespace: `astro-change-${process.env.VERCEL_PROJECT_ID || "president-6258"}`,
          })
        : undefined,
      scope,
    );
    collectors.set(scope, collector);
  }
  return collector;
}
export async function regionsHandler(
  req: IncomingMessage,
  res: ServerResponse,
) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (req.method !== "GET") {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }
  const params = new URL(req.url || "/", "http://localhost").searchParams;
  const region = params.getAll("region");
  const definition = region.length === 1 ? getRegion(region[0]) : undefined;
  if (!definition) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: "Selecione uma região válida." }));
    return;
  }
  const states: StateResult[] = [];
  for (let index = 0; index < definition.states.length; index += 3) {
    const batch = await Promise.all(
      definition.states
        .slice(index, index + 3)
        .map(async ([code, name]): Promise<StateResult> => {
          try {
            return { code, name, data: await getCollector(code).get() };
          } catch {
            return { code, name, error: "Fonte temporariamente indisponível." };
          }
        }),
    );
    states.push(...batch);
  }
  const data = consolidateRegion(definition.code, states);
  if (!data.stale) {
    res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
    res.setHeader(
      "Vercel-CDN-Cache-Control",
      "s-maxage=5, stale-while-revalidate=5",
    );
  }
  res.end(JSON.stringify(data));
}
