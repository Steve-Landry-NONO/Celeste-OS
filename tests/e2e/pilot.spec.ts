import { test, expect } from "@playwright/test";
test("navigation et règles financières du laboratoire isolé", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Construire CELESTE/ }),
  ).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("home.png"),
    fullPage: true,
  });
  await page
    .getByRole("link", { name: "Documents", exact: false })
    .first()
    .click();
  await expect(
    page.getByRole("heading", { name: /Chaque document/ }),
  ).toBeVisible();
  await expect(page.locator(".document-row")).toHaveCount(6);
  await page.getByRole("link", { name: /Laboratoire finance/ }).click();
  await page
    .getByRole("button", { name: "Charger le scénario de recette" })
    .click();
  await expect(page.getByTestId("costs")).toHaveText(/2\s?100,00\s?€/);
  await expect(page.getByTestId("cash")).toHaveText(/1\s?500,00\s?€/);
  await expect(page.locator(".history li")).toHaveCount(6);
  await page.screenshot({
    path: testInfo.outputPath("laboratory.png"),
    fullPage: true,
  });
  await page.getByLabel("Nature de l’opération").selectOption("fund_expense");
  await page.getByLabel("Montant en euros").fill("1500,01");
  await page.getByRole("button", { name: "Ajouter au simulateur" }).click();
  await expect(page.locator("form").getByRole("alert")).toContainText(
    "ne contient pas",
  );
  await expect(page.getByTestId("cash")).toHaveText(/1\s?500,00\s?€/);
  await expect(page.locator(".history li")).toHaveCount(6);
  await page.getByRole("button", { name: "Réinitialiser" }).click();
  await expect(page.getByTestId("cash")).toHaveText(/0,00\s?€/);
  await page.getByLabel("Nature de l’opération").selectOption("deposit");
  await page.getByLabel("Montant en euros").fill("12,34");
  await page.getByRole("button", { name: "Ajouter au simulateur" }).click();
  await expect(page.getByTestId("cash")).toHaveText(/12,34\s?€/);
  await page.reload();
  await expect(page.getByTestId("cash")).toHaveText(/0,00\s?€/);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});
