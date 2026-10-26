import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
const evidence = process.env.QA_EVIDENCE_DIR || "evidence";
await mkdir(evidence, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  });
  const errors = [],
    requests = [],
    failed = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  page.on("request", (r) => {
    if (r.url().endsWith("/api/results")) requests.push(Date.now());
  });
  page.on("requestfailed", (r) =>
    failed.push({
      url: new URL(r.url()).pathname,
      error: r.failure()?.errorText,
    }),
  );
  await page.addInitScript(() => {
    window.qaMetrics = { lcp: 0, cls: 0 };
    new window.PerformanceObserver((list) => {
      for (const e of list.getEntries()) window.qaMetrics.lcp = e.startTime;
    }).observe({ type: "largest-contentful-paint", buffered: true });
    new window.PerformanceObserver((list) => {
      for (const e of list.getEntries())
        if (!e.hadRecentInput) window.qaMetrics.cls += e.value;
    }).observe({ type: "layout-shift", buffered: true });
  });
  await page.goto(process.env.QA_URL || "http://127.0.0.1:5173");
  await page.getByRole("button", { name: "ENTRAR NO PICADEIRO" }).waitFor();
  await page.screenshot({
    path: path.join(evidence, "intro.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Entrar sem som" }).click();
  await page.locator(".intro").waitFor({ state: "detached" });
  await page.locator(".candidate").first().waitFor();
  await page
    .getByText("Assinatura oficial verificada", { exact: true })
    .waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: path.join(evidence, "desktop.png"),
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
      percentBottom: [...document.querySelectorAll(".percentage")].map(
        (e) => e.getBoundingClientRect().bottom,
      ),
      photos: [...document.querySelectorAll(".portrait")].map(
        (e) => e.complete && e.naturalWidth > 0,
      ),
    }));
    assert(layout.scrollWidth <= width, `Overflow at ${width}`);
    assert(layout.photos.every(Boolean), "Photo missing");
    if (width === 320)
      assert(
        layout.percentBottom.every((y) => y < height),
        "Percentages must fit compact first viewport",
      );
    layouts.push(layout);
    if (width === 390)
      await page.screenshot({
        path: path.join(evidence, "mobile.png"),
        fullPage: true,
      });
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(11000);
  const intervals = requests.slice(1).map((t, i) => t - requests[i]);
  assert(
    intervals.every((ms) => ms >= 4500),
    "Duplicate or aggressive polling",
  );
  const metrics = await page.evaluate(() => window.qaMetrics);
  const response = await page.request.get(
    new URL("/api/results", page.url()).href,
  );
  const envelope = await response.json();
  assert(envelope.verified && !envelope.stale, "Live signature not verified");
  assert.equal(errors.length, 0, errors.join("\n"));
  assert.equal(failed.length, 0, JSON.stringify(failed));
  await writeFile(
    path.join(evidence, "live-validation.json"),
    JSON.stringify(
      {
        checkedAt: new Date().toISOString(),
        mode: "live",
        applicationUrl: page.url(),
        verified: envelope.verified,
        sourceUrl: envelope.sourceUrl,
        generationId: envelope.result.generationId,
        layouts,
        requestCount: requests.length,
        intervals,
        metrics,
        consoleErrors: errors,
        failedRequests: failed,
      },
      null,
      2,
    ),
  );
  console.log(
    JSON.stringify({
      verified: true,
      layouts: layouts.length,
      intervals,
      metrics,
      errors,
    }),
  );
} finally {
  await browser.close();
}
