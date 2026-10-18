import { expect, type Page } from '@playwright/test';

/** Screens the home page has to fit on without scrolling. */
export const SCREENS = [
  { name: 'desktop 1440x900', width: 1440, height: 900 },
  { name: 'laptop 1280x720', width: 1280, height: 720 },
  { name: 'tablet 768x1024', width: 768, height: 1024 },
  { name: 'phone 375x667', width: 375, height: 667 },
  { name: 'small phone 360x640', width: 360, height: 640 },
  { name: 'phone on its side 812x375', width: 812, height: 375 },
] as const;

/** Requests that are expected to fail when the site is not on Vercel. */
export const IGNORED_REQUESTS = [/_vercel\/insights/];

export const shelf = (page: Page, label: string) => page.locator(`ul[aria-label="${label}"]`);

/** Waits until the shelf is on screen and interactive. */
export async function openHome(page: Page) {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Hey, I.m Jatin/ })).toBeVisible();
  await expect(shelf(page, 'Reading now').locator('button').first()).toBeVisible();
}

/** Opens the Photographs panel, then a trip by name, and returns the book dialog. */
export async function openTripBook(page: Page, trip: string) {
  await page.getByRole('button', { name: 'Photos', exact: true }).first().click();
  await page.getByRole('dialog', { name: 'Details' }).getByRole('button', { name: new RegExp(`^${trip}`) }).click();
  const book = page.locator('[aria-labelledby="trip-title"]');
  await expect(book).toBeVisible();
  await expect(book.locator('[data-photo]').first()).toBeVisible();
  return book;
}
