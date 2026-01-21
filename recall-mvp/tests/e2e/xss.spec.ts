import { test, expect } from '@playwright/test';

test('BookPage should not render malicious HTML', async ({ page }) => {
  const maliciousContent = 'Start <img src=x onerror=alert(1)> End';

  // Mock the API response
  await page.route('**/api/chapters/detail/test-id', async route => {
    const json = {
      id: 'test-id',
      title: 'Test Story',
      content: maliciousContent,
      createdAt: new Date().toISOString()
    };
    await route.fulfill({ json });
  });

  // Navigate to the page
  await page.goto('/stories/test-id/book');

  // Check if the image tag exists in the DOM (vulnerable)
  // If vulnerable, this locator will find the element.
  const img = page.locator('img[src="x"]');

  // We expect the image NOT to be attached (i.e., not rendered as an HTML tag)
  await expect(img).not.toBeAttached();

  // We expect the raw HTML string to be rendered as text instead
  await expect(page.getByText('<img src=x')).toBeVisible();
});
