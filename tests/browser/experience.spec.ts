import { test, expect } from "@playwright/test";
import { normalizeEA20 } from "../../src/lib/tse/normalizer";
import raw from "../ea20-official.json" with { type: "json" };
import AxeBuilder from "@axe-core/playwright";
const result = normalizeEA20(raw);
const payload = {
  result,
  verified: false,
  stale: false,
  checkedAt: new Date().toISOString(),
  sourceUrl: "https://resultados.tse.jus.br/",
};
test("responsive stage, intro, keyboard, dialogs and controls", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.route("**/api/results", (r) => r.fulfill({ json: payload }));
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "ENTRAR NO PICADEIRO" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Entrar sem som" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".intro")).toHaveCount(0);
  await expect(page.locator(".candidate")).toHaveCount(2);
  const accessibility = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(accessibility.violations).toEqual([]);
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
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const cards = page.locator(".candidate");
    expect(await cards.nth(0).locator(".percentage").isVisible()).toBe(true);
    if (width === 320) {
      for (const card of await cards.all()) {
        const rect = await card.locator(".percentage").boundingBox();
        expect(rect!.y + rect!.height).toBeLessThan(height);
      }
    }
  }
  await page
    .getByRole("button", { name: "Ver bastidores da apuração" })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Ver bastidores da apuração" }),
  ).toBeFocused();
  await page.getByRole("button", { name: "Sobre os dados" }).click();
  await expect(
    page.getByRole("heading", { name: "De onde vêm os dados?" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Reduzir movimentos" }).click();
  await expect(page.locator(".circus-shell")).toHaveAttribute(
    "data-motion",
    "reduced",
  );
  await page.getByRole("button", { name: /Som: mudo/ }).click();
  await expect(page.getByRole("button", { name: /Som: ligado/ })).toBeVisible();
  await page.getByRole("button", { name: /Som: ligado/ }).click();
  await page.getByRole("button", { name: /Som: reduzido/ }).click();
  expect(
    await page.evaluate(() => localStorage.getItem("astro-change.audio.level")),
  ).toBe("mute");
  await page.reload();
  await expect(page.locator(".intro")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Som: mudo/ })).toBeVisible();
  expect(errors).toEqual([]);
});
test("loading, recovered last snapshot, update, finale once, then final stops polling", async ({
  page,
}) => {
  let current = { ...payload };
  await page.setViewportSize({ width: 320, height: 568 });
  let count = 0;
  await page.route("**/api/results", async (route) => {
    count++;
    if (count === 1) await new Promise((resolve) => setTimeout(resolve, 800));
    await route.fulfill({ json: current });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Entrar sem som" }).click();
  await expect(page.locator(".candidate")).toHaveCount(2);
  const initialY = (await page.locator(".candidate-grid").boundingBox())!.y;
  current = { ...payload, stale: true };
  await expect(
    page.getByText(/Exibindo o último dado oficial recebido/),
  ).toBeVisible({ timeout: 12000 });
  await expect(page.locator(".candidate")).toHaveCount(2);
  current = {
    ...payload,
    result: {
      ...result,
      generationId: "1",
      mathematicallyDefined: "elected",
      status: "final",
      candidates: result.candidates.map((c) => ({ ...c, votes: c.votes + 1 })),
    },
  };
  await page.getByRole("button", { name: "Tentar novamente" }).click();
  await expect(
    page.getByRole("heading", {
      name: "O resultado está matematicamente definido",
    }),
  ).toBeVisible();
  await expect(page.getByText("APURAÇÃO ENCERRADA")).toBeVisible();
  expect((await page.locator(".candidate-grid").boundingBox())!.y).toBe(
    initialY,
  );
  for (const card of await page.locator(".candidate").all()) {
    const rect = await card.locator(".percentage").boundingBox();
    expect(rect!.y + rect!.height).toBeLessThan(568);
  }
  await expect
    .poll(() =>
      page.evaluate(() => sessionStorage.getItem("astro-change.finale.6258")),
    )
    .toBe("yes");
  const stopped = count;
  await page.waitForTimeout(6000);
  expect(count).toBe(stopped);
  await page.reload();
  await expect(page.locator(".finale-light")).toHaveCount(0);
});
test("initial failure and OS reduced motion remain usable", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route("**/api/results", (r) =>
    r.fulfill({ status: 503, json: { error: "Unavailable" } }),
  );
  await page.goto("/");
  await page.getByRole("button", { name: "Entrar sem som" }).click();
  await expect(
    page.getByText("FONTE TEMPORARIAMENTE INDISPONÍVEL"),
  ).toBeVisible();
  await expect(page.locator(".circus-shell")).toHaveAttribute(
    "data-motion",
    "reduced",
  );
  await expect(
    page.getByRole("button", { name: "Tentar novamente" }),
  ).toBeVisible();
});
