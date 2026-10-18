import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('the resume page has its bar, a way back to the shelf, and the PDF', async ({ page }) => {
  await page.goto('/resume');
  await expect(page.getByRole('heading', { name: 'Resume' })).toBeVisible();
  await expect(page.locator('iframe[title="Resume"]')).toHaveAttribute('src', '/resume.pdf');
  await expect(page.getByRole('link', { name: 'open the PDF' })).toHaveAttribute('href', '/resume.pdf');
  await page.getByRole('link', { name: 'Back to the shelf' }).click();
  await expect(page.getByRole('heading', { name: /Hey, I.m Jatin/ })).toBeVisible();
});

test('the resume page does not scroll sideways on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/resume');
  await expect(page.getByRole('heading', { name: 'Resume' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
});

for (const scheme of ['light', 'dark'] as const) {
  test(`the resume page passes the accessibility scan: ${scheme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto('/resume');
    await expect(page.getByRole('heading', { name: 'Resume' })).toBeVisible();
    const violations = (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()).violations.map(
      (v) => `${v.id} (${v.impact}): ${v.help}`,
    );
    expect(violations).toEqual([]);
  });
}
