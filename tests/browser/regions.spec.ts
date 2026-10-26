import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import national from "../ea20-official.json" with { type: "json" };
import stateRaw from "../ea20-sp-official.json" with { type: "json" };
import { normalizeEA20 } from "../../src/lib/tse/normalizer";
import { consolidateRegion } from "../../src/lib/tse/regions";
import { getRegion, type RegionCode } from "../../src/lib/tse/geography";
import { resultUrl } from "../../src/lib/tse/urls";
function regionPayload(code: RegionCode, missing = false) {
  return consolidateRegion(
    code,
    getRegion(code)!.states.map(([uf, name], i) => ({
      code: uf,
      name,
      data:
        missing && i === 0
          ? undefined
          : {
              result: normalizeEA20({ ...stateRaw, cdabr: uf }, uf),
              verified: true,
              stale: false,
              checkedAt: new Date().toISOString(),
              sourceUrl: resultUrl("jws", uf),
            },
    })),
  );
}
test("regional drilldown, scope isolation, partial sources and keyboard work on mobile", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  let requests = 0;
  await page.route("**/api/results", (r) =>
    r.fulfill({
      json: {
        result: normalizeEA20(national),
        verified: true,
        stale: false,
        checkedAt: new Date().toISOString(),
        sourceUrl: resultUrl("jws"),
      },
    }),
  );
  await page.route("**/api/regions?*", async (r) => {
    requests++;
    const region = new URL(r.request().url()).searchParams.get(
      "region",
    ) as RegionCode;
    if (region === "sul")
      await new Promise((resolve) => setTimeout(resolve, 700));
    await r.fulfill({ json: regionPayload(region, region === "nordeste") });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Entrar sem som" }).click();
  await expect(page.locator(".intro")).toHaveCount(0);
  await expect(page.locator(".candidate")).toHaveCount(2);
  expect(requests).toBe(0);
  await page.getByRole("button", { name: "Explorar por região" }).click();
  expect(requests).toBe(0);
  await page.getByRole("button", { name: /^Sudeste/ }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("table")).toBeVisible();
  await expect(page.getByRole("row")).toHaveCount(5);
  await page.getByRole("button", { name: /São Paulo/ }).click();
  await expect(
    page.getByRole("heading", { name: "São Paulo", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".state-detail .candidate")).toHaveCount(2);
  await expect(page.locator(".finale-message")).toHaveCount(0);
  const accessibility = await new AxeBuilder({ page })
    .include(".regional-section")
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(accessibility.violations).toEqual([]);
  for (const [width, height] of [
    [320, 568],
    [390, 844],
    [768, 1024],
    [1440, 900],
  ]) {
    await page.setViewportSize({ width, height });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
  await page.getByRole("button", { name: /^Sul/ }).click();
  await expect(
    page.getByRole("heading", { name: "São Paulo", exact: true }),
  ).toHaveCount(0);
  await expect(page.getByRole("table")).toHaveCount(0);
  await expect(page.getByRole("row")).toHaveCount(4);
  await page.getByRole("button", { name: /^Nordeste/ }).click();
  await expect(
    page.getByText("A consolidação aguarda todas as fontes deste recorte."),
  ).toBeVisible();
  await expect(page.locator(".regional-summary")).toHaveCount(0);
  await expect(page.getByRole("row")).toHaveCount(10);
  await expect(page.locator("main > .candidate-grid .candidate")).toHaveCount(
    2,
  );
  await page.getByRole("button", { name: /^Exterior/ }).click();
  await expect(page.getByRole("row")).toHaveCount(2);
  await page.getByRole("button", { name: "Fechar recortes" }).click();
  await expect(page.getByRole("table")).toHaveCount(0);
  expect(errors).toEqual([]);
});
test("regional network failure preserves its own last snapshot and retry recovers", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  let offline = false;
  await page.route("**/api/results", (r) =>
    r.fulfill({
      json: {
        result: normalizeEA20(national),
        verified: true,
        stale: false,
        checkedAt: new Date().toISOString(),
        sourceUrl: resultUrl("jws"),
      },
    }),
  );
  await page.route("**/api/regions?*", (r) =>
    offline
      ? r.fulfill({ status: 503, json: { error: "Offline" } })
      : r.fulfill({ json: regionPayload("sudeste") }),
  );
  await page.goto("/");
  await page.getByRole("button", { name: "Entrar sem som" }).click();
  await page.getByRole("button", { name: "Explorar por região" }).click();
  await page.getByRole("button", { name: /^Sudeste/ }).click();
  await expect(page.getByRole("row")).toHaveCount(5);
  offline = true;
  await expect(
    page.getByText(/Exibindo os últimos dados recebidos de cada UF/),
  ).toBeVisible({ timeout: 20000 });
  await expect(page.getByRole("row")).toHaveCount(5);
  offline = false;
  await page.getByRole("button", { name: "Tentar região novamente" }).click();
  await expect(
    page.getByText(/Exibindo os últimos dados recebidos de cada UF/),
  ).toHaveCount(0);
  await expect(page.getByRole("row")).toHaveCount(5);
});
