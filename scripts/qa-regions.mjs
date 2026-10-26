import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
const base = process.env.QA_URL || "http://127.0.0.1:4180";
const output = process.env.QA_EVIDENCE_DIR || "evidence/regions-local";
await mkdir(output, { recursive: true });
const coverage = [];
for (const region of [
  "norte",
  "nordeste",
  "centro-oeste",
  "sudeste",
  "sul",
  "exterior",
]) {
  const response = await fetch(`${base}/api/regions?region=${region}`, {
    signal: AbortSignal.timeout(65000),
  });
  assert.equal(response.status, 200);
  const data = await response.json();
  assert(data.verifiedSources, `${region}: sources not verified`);
  assert(!data.stale, `${region}: stale source`);
  assert(data.summary, `${region}: missing summary`);
  assert.equal(data.summary.mathematicallyDefined, "none");
  assert(data.summary.candidates.every((c) => !c.elected));
  const votes = data.states.reduce(
    (total, s) => total + s.data.result.votes.total,
    0,
  );
  assert.equal(data.summary.votes.total, votes);
  const sections = data.states.reduce(
    (total, s) => total + s.data.result.progress.countedSections,
    0,
  );
  assert.equal(data.summary.progress.countedSections, sections);
  coverage.push({
    region,
    status: response.status,
    states: data.states.map((s) => ({
      code: s.code,
      verified: s.data.verified,
      sourceUrl: s.data.sourceUrl,
      generationId: s.data.result.generationId,
      generatedAt: s.data.result.generatedAt,
    })),
    candidateVotes: data.summary.candidates.map((c) => ({
      candidateId: c.candidateId,
      votes: c.votes,
      percent: c.percent,
    })),
    totalVotes: votes,
    countedSections: sections,
  });
}
const browser = await chromium.launch({ channel: "chrome" });
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  });
  const errors = [],
    failed = [],
    polls = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  page.on("requestfailed", (r) => failed.push(new URL(r.url()).pathname));
  page.on("request", (r) => {
    if (r.url().endsWith("/api/regions?region=sudeste")) polls.push(Date.now());
  });
  await page.goto(base);
  await page.getByRole("button", { name: "Entrar sem som" }).click();
  await page.locator(".intro").waitFor({ state: "detached" });
  await page.getByRole("button", { name: "Explorar por região" }).click();
  await page.getByRole("button", { name: /^Sudeste/ }).click();
  await page.getByRole("table").waitFor();
  await page.getByRole("button", { name: /São Paulo/ }).click();
  await page.locator(".state-detail .candidate").first().waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: path.join(output, "desktop.png"),
    fullPage: true,
  });
  const layouts = [];
  for (const [width, height] of [
    [320, 568],
    [375, 812],
    [390, 844],
    [768, 1024],
    [1366, 768],
    [1440, 900],
    [1920, 1080],
  ]) {
    await page.setViewportSize({ width, height });
    const layout = await page.evaluate(() => ({
      width: window.innerWidth,
      height: window.innerHeight,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    assert(layout.scrollWidth <= width, `Overflow at ${width}`);
    layouts.push(layout);
    if (width === 390)
      await page.screenshot({
        path: path.join(output, "mobile.png"),
        fullPage: true,
      });
  }
  await page.waitForTimeout(16000);
  assert(polls.length >= 2, "Regional polling did not run");
  const intervals = polls.slice(1).map((time, index) => time - polls[index]);
  assert(
    intervals.every((ms) => ms >= 14000),
    "Duplicate regional polling",
  );
  assert.deepEqual(errors, []);
  assert.deepEqual(failed, []);
  const result = {
    checkedAt: new Date().toISOString(),
    applicationUrl: base,
    coverage,
    layouts,
    regionalPollIntervals: intervals,
    consoleErrors: errors,
    failedRequests: failed,
  };
  await writeFile(
    path.join(output, "validation.json"),
    JSON.stringify(result, null, 2),
  );
  console.log(
    JSON.stringify({
      regions: coverage.length,
      states: coverage.reduce((n, r) => n + r.states.length, 0),
      verified: true,
      layouts: layouts.length,
      intervals,
      errors,
    }),
  );
} finally {
  await browser.close();
}
