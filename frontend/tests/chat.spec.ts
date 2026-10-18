import { expect, test } from "@playwright/test";
import { resetBoard } from "./helpers";

test.beforeEach(async ({ page, baseURL }) => {
  await resetBoard(baseURL);
  await page.goto("/");
  await page.getByLabel(/username/i).fill("user");
  await page.getByLabel(/password/i).fill("password");
  await page.getByRole("button", { name: /^sign in$/i }).click();
  await expect(
    page.getByRole("heading", { name: "Kanban Studio" })
  ).toBeVisible();
});

test("chat answers a question about the board", async ({ page }) => {
  // Live AI calls can be slow; give these tests extra headroom.
  test.setTimeout(180_000);
  await page.goto("/");
  await page
    .getByLabel(/chat message/i)
    .fill("How many columns does my board have? Reply with just the number.");
  await page.getByRole("button", { name: /send/i }).click();
  await expect(page.getByTestId("assistant-message").first()).toBeVisible({
    timeout: 90_000,
  });
  await expect(page.getByTestId("assistant-message").first()).toContainText("5");
});

test("chat can rename a column and the board refreshes", async ({ page }) => {
  test.setTimeout(180_000);
  await page.goto("/");
  const firstColumnTitle = page
    .locator('[data-testid^="column-"]')
    .first()
    .getByLabel("Column title");
  const originalTitle = await firstColumnTitle.inputValue();

  await page
    .getByLabel(/chat message/i)
    .fill("Rename the first column (Backlog) to Ideas. Just do it.");
  await page.getByRole("button", { name: /send/i }).click();
  await expect(page.getByTestId("assistant-message").first()).toBeVisible({
    timeout: 90_000,
  });
  await expect(firstColumnTitle).toHaveValue("Ideas", { timeout: 30_000 });

  // restore the original title via the UI
  const restored = page.waitForResponse(
    (response) =>
      response.url().includes("/api/board") &&
      response.request().method() === "PUT"
  );
  await firstColumnTitle.fill(originalTitle);
  await restored;
});
