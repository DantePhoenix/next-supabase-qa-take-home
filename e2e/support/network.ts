import type { Page } from "@playwright/test";
import { API_PATH, API_ROUTE } from "./constants";

/**
 * Keeps API requests "in flight" until `release()` is called.
 * This makes the loading state deterministic, independent of timing.
 * Must be called BEFORE the action that triggers the request.
 */
export async function holdApi(page: Page) {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => (release = resolve));
  await page.route(API_ROUTE, async (route) => {
    await gate;
    await route.continue();
  });
  return { release: () => release() };
}

/**
 * Counts the requests sent to the records API (/api/records).
 * Used to demonstrate that an invalid input sends nothing.
 */
export function trackApiRequests(page: Page) {
  let count = 0;
  page.on("request", (req) => {
    if (req.url().includes(API_PATH)) count++;
  });
  return () => count;
}
