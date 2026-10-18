import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { SCREENS, openHome, openTripBook } from './helpers';

const PER_PAGE = 6;
const trips = [
  { id: 'mexico', name: 'Mexico' },
  { id: 'italy', name: 'Italy' },
].map((t) => ({ ...t, count: JSON.parse(readFileSync(`src/data/trips/${t.id}.json`, 'utf8')).photos.length as number }));

for (const trip of trips) {
  test(`${trip.name}: six frames to a page, every photo once, nothing cut off (wide)`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await openHome(page);
    const book = await openTripBook(page, trip.name);
    const seen: number[] = [];
    const pageCount = Math.ceil(trip.count / PER_PAGE);
    for (let guard = 0; guard < pageCount + 2; guard++) {
      const sections = book.locator('section');
      const n = await sections.count();
      for (let i = 0; i < n; i++) {
        const frames = await sections.nth(i).locator('[data-photo]').count();
        seen.push(frames);
        expect(frames).toBeLessThanOrEqual(PER_PAGE);
      }
      const cut = await book.evaluate((el) =>
        [...el.querySelectorAll('section')].flatMap((s) => {
          const area = s.querySelector('[class*="frames"]')!.getBoundingClientRect();
          return [...s.querySelectorAll('[data-photo]')].filter((f) => {
            const r = f.getBoundingClientRect();
            return r.bottom > area.bottom + 1 || r.right > area.right + 1;
          }).length;
        }),
      );
      expect(cut.every((c) => c === 0), 'frames cut off by their page').toBe(true);
      const next = book.getByRole('button', { name: 'Next page' });
      if (await next.isDisabled()) break;
      await next.click();
    }
    expect(seen.reduce((a, b) => a + b, 0)).toBe(trip.count);
    // every page but the last holds exactly six
    expect(seen.slice(0, -1).every((c) => c === PER_PAGE)).toBe(true);
  });
}

for (const screen of SCREENS) {
  test(`book fits the screen and shows frames: ${screen.name}`, async ({ page }) => {
    await page.setViewportSize({ width: screen.width, height: screen.height });
    await openHome(page);
    const book = await openTripBook(page, 'Italy');
    const box = await book.boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(screen.width + 1);
    expect(box!.y + box!.height).toBeLessThanOrEqual(screen.height + 1);
    expect(await book.locator('[data-photo]').count()).toBeGreaterThan(0);
    const sideways = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(sideways).toBeLessThanOrEqual(0);
  });
}

test('Escape closes the photo first, then the book, then the panel; focus returns each time', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await openHome(page);
  const book = await openTripBook(page, 'Italy');
  const frame = book.locator('[data-photo]').nth(2);
  await frame.focus();
  await page.keyboard.press('Enter');
  const dialogs = page.locator('[role="dialog"]');
  await expect(dialogs).toHaveCount(3);
  await page.keyboard.press('Escape');
  await expect(dialogs).toHaveCount(2);
  await expect(frame).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialogs).toHaveCount(1);
  await page.keyboard.press('Escape');
  await expect(dialogs).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Photos', exact: true }).first()).toBeFocused();
});

test('arrow keys turn the page; stepping through photos keeps the book on the right page', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await openHome(page);
  const book = await openTripBook(page, 'Italy');
  const count = book.getByRole('navigation', { name: 'Pages' });
  await expect(count).toContainText('1–12 of 34');
  await page.keyboard.press('ArrowRight');
  await expect(count).toContainText('13–24 of 34');
  await page.keyboard.press('ArrowLeft');
  await expect(count).toContainText('1–12 of 34');
  // open photo 12, step forward to photo 13: the book must now be on the second spread
  await book.locator('[data-photo]').nth(11).click();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Escape');
  await expect(count).toContainText('13–24 of 34');
});

test('the /trips page lists every trip and opens a book', async ({ page }) => {
  await page.goto('/trips');
  await expect(page.getByRole('heading', { name: 'Photographs' })).toBeVisible();
  for (const t of trips) await expect(page.getByRole('button', { name: new RegExp(`^${t.name}`) })).toBeVisible();
  await page.getByRole('button', { name: /^Mexico/ }).click();
  await expect(page.locator('[aria-labelledby="trip-title"]')).toBeVisible();
});
