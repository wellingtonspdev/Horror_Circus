import express from "express";
import { resultsHandler } from "./handler.ts";
const app = express();
app.disable("x-powered-by");
app.get("/api/results", resultsHandler);
app.use(express.static("dist"));
app.listen(Number(process.env.PORT) || 4173, "127.0.0.1", () =>
  console.log("Astro Change: http://127.0.0.1:4173"),
);

