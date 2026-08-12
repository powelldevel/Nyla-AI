import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("shows the honest planning status", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/Nyla — Engineering foundation/);
  await expect(
    page.getByRole("heading", { level: 1, name: /Trusted answers begin/ }),
  ).toBeVisible();
  await expect(page.getByText("Planning complete")).toBeVisible();
  await expect(page.getByText("Foundation in progress")).toBeVisible();
  await expect(page.getByRole("link", { name: /Review the documentation/ })).toHaveAttribute(
    "href",
    "https://github.com/powelldevel/Nyla-AI/tree/main/docs",
  );
});

test("has no automatically detectable accessibility violations", async ({ page }) => {
  await page.goto("/");

  const results = await new AxeBuilder({ page }).analyze();

  expect(results.violations).toEqual([]);
});
