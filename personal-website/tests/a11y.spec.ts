import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { openHome, openTripBook } from './helpers';

const scan = async (page: Page) =>
  (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()).violations.map(
    (v) => `${v.id} (${v.impact}): ${v.help}; ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`,
  );

for (const scheme of ['light', 'dark'] as const) {
  test.describe(scheme, () => {
    // no animation, so a panel is scanned at rest, not mid-fade
    test.use({ colorScheme: scheme, viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });

    test('home', async ({ page }) => {
      await openHome(page);
      expect(await scan(page)).toEqual([]);
    });

    test('a book panel', async ({ page }) => {
      await openHome(page);
      await page.getByRole('button', { name: 'Work', exact: true }).click();
      await expect(page.getByRole('dialog', { name: 'Details' })).toBeVisible();
      expect(await scan(page)).toEqual([]);
    });

    test('the photo book', async ({ page }) => {
      await openHome(page);
      await openTripBook(page, 'Italy');
      expect(await scan(page)).toEqual([]);
    });

    test('the /trips page', async ({ page }) => {
      await page.goto('/trips');
      await expect(page.getByRole('heading', { name: 'Photographs' })).toBeVisible();
      expect(await scan(page)).toEqual([]);
    });
  });
}
