import express from "express";
import { resultsHandler } from "./handler.ts";
import { regionsHandler } from "./regions-handler.ts";
const app = express();
app.disable("x-powered-by");
app.get("/api/results", resultsHandler);
app.get("/api/regions", regionsHandler);
app.use(express.static("dist"));
const port = Number(process.env.PORT) || 4173;
app.listen(port, "127.0.0.1", () =>
  console.log(`Astro Change: http://127.0.0.1:${port}`),
);
