import { test, expect } from '@playwright/test';
import { createHash } from 'node:crypto';

async function login(page) {
  await page.goto('/admin/login');
  await page.locator('#username').fill('test-admin');
  await page.locator('#password').fill('test-password');
  await page.getByRole('button', { name: 'Login', exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/dashboard$/);
  await expect(page.locator('.timetable-row')).toHaveCount(7);
}

test.beforeEach(async ({ request }) => { await request.post('/__test/reset'); });

for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
  for (const scenario of [
    { name: 'home', route: '/' },
    { name: 'login', route: '/admin/login' },
    { name: 'post-notice', route: '/admin/dashboard' },
    { name: 'timetable', route: '/admin/dashboard', tab: '#timetable-tab' },
    { name: 'notices', route: '/admin/dashboard', tab: '#notices-tab' },
    { name: 'access', route: '/admin/dashboard', tab: '#access-tab' }
  ]) {
    test(`appearance matches original: ${scenario.name} at ${viewport.width}px`, async ({ page, context }, testInfo) => {
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.setViewportSize(viewport);
      if (scenario.route === '/admin/dashboard') await login(page);
      const original = await context.newPage();
      await original.setViewportSize(viewport);
      for (const [target, url] of [[original, `http://127.0.0.1:5100${scenario.route}`], [page, scenario.route]]) {
        await target.goto(url);
        await target.waitForFunction(() => Boolean(window.bootstrap));
        if (scenario.name === 'home') await expect(target.locator('.schedule-card')).toHaveCount(7);
        if (scenario.route === '/admin/dashboard') await expect(target.locator('.timetable-row')).toHaveCount(7);
        if (scenario.tab) await target.locator(scenario.tab).click();
        await target.evaluate(async () => {
          await document.fonts.ready;
          await Promise.all([...document.images].map(img => img.decode().catch(() => {})));
          if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
          window.scrollTo(0, 0);
        });
      }
      const before = await original.screenshot({ path: testInfo.outputPath('original.png'), fullPage: true, animations: 'disabled' });
      const after = await page.screenshot({ path: testInfo.outputPath('react.png'), fullPage: true, animations: 'disabled' });
      const hash = value => createHash('sha256').update(value).digest('hex');
      if (hash(before) !== hash(after)) {
        await testInfo.attach('original', { body: before, contentType: 'image/png' });
        await testInfo.attach('react', { body: after, contentType: 'image/png' });
      }
      expect(hash(after), 'Rendered pixels must match the original page').toBe(hash(before));
      expect(errors).toEqual([]);
      await original.close();
    });
  }
}

test('login errors, protected routes, aliases and logout', async ({ page, request }) => {
  // The existing desktop attribution overlaps Logout at narrower desktop widths.
  // Preserve the design and exercise the accessible mobile navigation instead.
  for (const url of ['/admin/dashboard', '/admin-dashboard.html']) {
    const response = await request.get(url, { maxRedirects: 0 });
    expect(response.status()).toBe(302);
    expect(response.headers().location).toBe('/admin/login');
  }
  for (const [method, url] of [['post', '/admin/notice'], ['put', '/admin/notice/507f1f77bcf86cd799439011'], ['delete', '/admin/notice/507f1f77bcf86cd799439011'], ['put', '/admin/timetable']]) {
    expect((await request[method](url, { data: {} })).status()).toBe(401);
  }
  await page.goto('/admin-login.html');
  await page.locator('#username').fill('test-admin');
  await page.locator('#password').fill('wrong-password');
  await page.getByRole('button', { name: 'Login', exact: true }).click();
  await expect(page.locator('#flash-message')).toHaveText('Invalid username or password.');
  await login(page);
  await page.goto('/admin-dashboard.html');
  await expect(page.locator('#notice-form')).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Toggle navigation' }).click();
  await page.getByRole('button', { name: 'Logout' }).click();
  await expect(page).toHaveURL(/\/admin\/login$/);
  await expect(page.locator('#flash-message')).toHaveText('Logged out successfully.');
  await page.goto('/admin/dashboard');
  await expect(page).toHaveURL(/\/admin\/login$/);
  await page.goto('/index.html');
  await expect(page.locator('.schedule-card')).toHaveCount(7);
});

test('notice create, image preview, edit, cancel and delete', async ({ page }) => {
  await login(page);
  await page.locator('#title').fill('New notice <safe>');
  await page.locator('#content').fill('First line\nSecond line');
  await page.locator('#image').setInputFiles('frontend/static/oldies.png');
  await expect(page.locator('#image-preview img')).toBeVisible();
  await page.getByRole('button', { name: 'Save Notice' }).click();
  await expect(page.locator('#status-message')).toContainText('Notice posted.');
  await expect(page.locator('#image-preview img')).toHaveCount(0);
  await page.locator('#notices-tab').click();
  let card = page.locator('.notice-card').filter({ hasText: 'New notice <safe>' });
  await expect(card.locator('img')).toBeVisible();
  await card.getByRole('button', { name: 'Edit', exact: true }).click();
  await expect(page.locator('#title')).toHaveValue('New notice <safe>');
  await page.locator('#cancel-edit').click();
  await expect(page.locator('#title')).toHaveValue('');
  await page.locator('#notices-tab').click();
  await card.getByRole('button', { name: 'Edit', exact: true }).click();
  await page.locator('#title').fill('Updated notice');
  await page.getByRole('button', { name: 'Save Notice' }).click();
  await expect(page.locator('#status-message')).toContainText('Notice updated.');
  await page.goto('/');
  card = page.locator('.notice-card').filter({ hasText: 'Updated notice' });
  await expect(card).toContainText('First line\nSecond line');
  await expect(card.locator('img')).toBeVisible();
  await page.goto('/admin/dashboard');
  await page.locator('#notices-tab').click();
  page.once('dialog', dialog => dialog.accept());
  await page.locator('.notice-card').filter({ hasText: 'Updated notice' }).getByRole('button', { name: 'Delete' }).click();
  await expect(page.locator('.notice-card')).toHaveCount(1);
});

test('timetable persistence, registration, dismissible alerts and mobile navigation', async ({ page }) => {
  await login(page);
  await page.locator('#timetable-tab').click();
  await page.locator('#activities-0').fill('Updated Monday activity');
  await page.getByRole('button', { name: 'Save Timetable' }).click();
  await expect(page.locator('#timetable-status')).toContainText('Timetable updated.');
  await page.locator('#timetable-status').getByRole('button', { name: 'Close' }).click();
  await expect(page.locator('#timetable-status')).toBeEmpty();
  await page.locator('#access-tab').click();
  await page.locator('#reg-username').fill('second-admin');
  await page.locator('#reg-password').fill('second-password');
  await page.getByRole('button', { name: 'Register Admin' }).click();
  await expect(page.locator('#register-status')).toContainText('Admin registered.');
  await expect(page.locator('#reg-username')).toHaveValue('');
  await page.goto('/');
  await expect(page.locator('.schedule-card').first()).toContainText('Updated Monday activity');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Toggle navigation' }).click();
  await expect(page.locator('#mainNavbar')).toBeVisible();
  await page.locator('#mainNavbar').getByRole('link', { name: 'Timetable', exact: true }).click();
  await expect(page).toHaveURL(/#schedule$/);
});

test('public request failures retain existing fallback content', async ({ page }) => {
  await page.route('**/notices', route => route.abort());
  await page.route('**/timetable', route => route.abort());
  await page.goto('/');
  await expect(page.locator('.schedule-card')).toHaveCount(7);
  await expect(page.locator('#noticeboard-posts')).toHaveText('Notices could not be loaded right now.');
});
