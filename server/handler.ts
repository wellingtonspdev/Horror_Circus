import type { IncomingMessage, ServerResponse } from "node:http";
import { Collector } from "./collector.ts";
import { getCache } from "@vercel/functions";
const collector = new Collector(
  fetch,
  process.env.TSE_FORMAT === "json" ? "json" : "jws",
  () => Date.now(),
  process.env.VERCEL === "1"
    ? getCache({
        namespace: `astro-change-${process.env.VERCEL_PROJECT_ID || "president-6258"}`,
      })
    : undefined,
);
export async function resultsHandler(
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
  try {
    const data = await collector.get();
    if (!data.stale) {
      res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
      res.setHeader(
        "Vercel-CDN-Cache-Control",
        "s-maxage=5, stale-while-revalidate=5",
      );
    }
    res.end(JSON.stringify(data));
  } catch (error) {
    res.statusCode = 503;
    res.end(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Fonte indisponível",
      }),
    );
  }
}
