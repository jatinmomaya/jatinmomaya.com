import { expect, test } from '@playwright/test';
import { IGNORED_REQUESTS, SCREENS, openHome, shelf } from './helpers';

for (const screen of SCREENS) {
  test(`home fits one screen with nothing cut off: ${screen.name}`, async ({ page }) => {
    await page.setViewportSize({ width: screen.width, height: screen.height });
    await openHome(page);
    const m = await page.evaluate(() => {
      const root = document.querySelector('[class*="page"]') as HTMLElement;
      const rect = (e: Element) => e.getBoundingClientRect();
      const cut: string[] = [];
      document.querySelectorAll('ul[aria-label]').forEach((row) => {
        const r = rect(row);
        row.querySelectorAll('button').forEach((b) => {
          const br = rect(b);
          const label = b.getAttribute('aria-label') ?? '';
          if (br.top < r.top - 0.5 || br.bottom > r.bottom + 1) cut.push(`${label}: outside its shelf`);
          const title = b.querySelector('span');
          if (title && title.scrollHeight > title.clientHeight + 1) cut.push(`${label}: title is cut off`);
        });
        if (row.scrollWidth > row.clientWidth + 1) cut.push(`${row.getAttribute('aria-label')}: shelf scrolls sideways`);
      });
      const sentences = [...document.querySelectorAll('header p span')].map((s) => {
        const lh = parseFloat(getComputedStyle(s).lineHeight);
        return Math.round(rect(s).height / lh);
      });
      return {
        pageOverflow: root.scrollHeight - root.clientHeight,
        docOverflow: document.documentElement.scrollHeight - window.innerHeight,
        sideways: document.documentElement.scrollWidth - window.innerWidth,
        cut,
        sentences,
      };
    });
    expect(m.pageOverflow, 'page scrolls').toBeLessThanOrEqual(0);
    expect(m.docOverflow, 'document scrolls').toBeLessThanOrEqual(0);
    expect(m.sideways, 'page scrolls sideways').toBeLessThanOrEqual(0);
    expect(m.cut).toEqual([]);
    // each sentence of the tagline stays on one line
    expect(m.sentences.every((n) => n === 1), `tagline lines: ${m.sentences}`).toBe(true);
  });
}

// Linux and Android fall back to a wider monospace font than Windows or macOS (about 0.6em a letter).
// Courier New is that wide, so forcing it here stands in for those devices.
for (const screen of SCREENS.filter((s) => s.width <= 812)) {
  test(`spine titles still fit when the monospace font is wide: ${screen.name}`, async ({ page }) => {
    await page.setViewportSize({ width: screen.width, height: screen.height });
    await page.addInitScript(() => {
      const css = document.createElement('style');
      css.textContent = "button span, button { font-family: 'Courier New', Courier, monospace !important; }";
      document.addEventListener('DOMContentLoaded', () => document.head.appendChild(css));
    });
    await openHome(page);
    const cut = await page.evaluate(() =>
      [...document.querySelectorAll('ul[aria-label] button')].flatMap((b) => {
        const t = b.querySelector('span');
        return t && t.scrollHeight > t.clientHeight + 1 ? [b.getAttribute('aria-label') ?? ''] : [];
      }),
    );
    expect(cut).toEqual([]);
  });
}

test('no failed requests or console errors on the home page', async ({ page }) => {
  const problems: string[] = [];
  page.on('console', (m) => m.type() === 'error' && problems.push(`console: ${m.text()}`));
  page.on('pageerror', (e) => problems.push(`error: ${e.message}`));
  page.on('response', (r) => {
    if (r.status() >= 400) problems.push(`${r.status()} ${r.url()}`);
  });
  await openHome(page);
  await page.getByRole('button', { name: 'Work', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Details' })).toBeVisible();
  // the Vercel analytics script only exists on Vercel; a console line about it is expected here
  const real = problems.filter((p) => !IGNORED_REQUESTS.some((re) => re.test(p)) && !/Failed to load resource/.test(p));
  expect(real).toEqual([]);
});

test('shelf shows the reading books and the favorites, with no Goodreads text', async ({ page }) => {
  await openHome(page);
  expect(await shelf(page, 'Reading now').locator('button').count()).toBeGreaterThan(0);
  expect(await shelf(page, 'Favorites').locator('button').count()).toBeGreaterThan(0);
  await expect(page.locator('body')).not.toContainText(/goodreads/i);
  await expect(page.getByText('Consultant by profession.')).toBeVisible();
});

test('a book opens a panel; Escape closes it and focus returns to the book', async ({ page }) => {
  await openHome(page);
  const book = shelf(page, 'Favorites').locator('button').nth(1);
  await book.focus();
  await page.keyboard.press('Enter');
  const panel = page.getByRole('dialog', { name: 'Details' });
  await expect(panel).toBeVisible();
  await expect(panel.getByRole('button', { name: 'Close' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(panel).toBeHidden();
  await expect(book).toBeFocused();
});

test('Tab stays inside an open panel', async ({ page }) => {
  await openHome(page);
  await page.getByRole('button', { name: 'Work', exact: true }).click();
  const panel = page.getByRole('dialog', { name: 'Details' });
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press('Tab');
    expect(await panel.evaluate((el) => el.contains(document.activeElement))).toBe(true);
  }
});

test('closing does not wait on an animation (reduced motion)', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openHome(page);
  await page.getByRole('button', { name: 'Photos', exact: true }).first().click();
  const panel = page.getByRole('dialog', { name: 'Details' });
  await panel.getByRole('button', { name: /^Mexico/ }).click();
  const book = page.locator('[aria-labelledby="trip-title"]');
  await expect(book).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(book).toBeHidden({ timeout: 1000 });
});

for (const scheme of ['light', 'dark'] as const) {
  test(`${scheme} mode follows the device`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await openHome(page);
    const luminance = await page.evaluate(() => {
      const c = getComputedStyle(document.querySelector('[class*="page"]') as Element).backgroundImage.match(/\d+/g)!.slice(0, 3).map(Number);
      return (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255;
    });
    if (scheme === 'dark') expect(luminance).toBeLessThan(0.2);
    else expect(luminance).toBeGreaterThan(0.7);
  });
}
