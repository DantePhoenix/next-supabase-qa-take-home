import type { Page } from "@playwright/test";

/**
 * Choose an option from both a native <select> and a custom select (Radix/shadcn).
 */
export async function chooseOption(page: Page, testId: string, label: string) {
  const control = page.getByTestId(testId);
  const tag = await control.evaluate((el) => el.tagName);
  if (tag === "SELECT") {
    await control.selectOption({ label });
  } else {
    await control.click();
    await page.getByRole("option", { name: label, exact: true }).click();
  }
}
