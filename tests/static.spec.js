import { test, expect } from '@playwright/test';
import { defaultTimetable } from '../shared/timetable.js';

async function fixture(page, options = {}) {
  const state = {
    authenticated: false,
    writes: [],
    events: [],
    contacts: [],
    notices: [],
    token: 0,
    ...options,
  };
  await page.route('**/senior-citz/api/**', async (route) => {
    const req = route.request();
    const path = new URL(req.url()).pathname.split('/senior-citz/api')[1];
    const method = req.method();
    const respond = (data, status = 200) => route.fulfill({ status, json: data });
    if (path === '/csrf-token') return respond({ csrfToken: `token-${++state.token}` });
    if (method !== 'GET') {
      state.writes.push({ path, headers: req.headers(), body: req.postData() });
      if (!req.headers()['x-csrf-token']) return respond({ error: 'Missing CSRF' }, 403);
      if (state.rejectWrite) return respond({ error: 'Rejected' }, state.rejectWrite);
    }
    if (path === '/admin/login') {
      if (req.postDataJSON().password !== 'test-password')
        return respond({ error: 'Invalid credentials' }, 401);
      state.authenticated = true;
      return respond({ success: true });
    }
    if (path === '/auth/session')
      return state.sessionFailure
        ? respond({}, 503)
        : respond(
            state.authenticated ? { authenticated: true } : {},
            state.authenticated ? 200 : 401,
          );
    if (path === '/notices') return respond(state.notices);
    if (path === '/timetable') return respond(defaultTimetable);
    if (!state.authenticated) return respond({}, 401);
    if (path === '/admin/logout') state.authenticated = false;
    if (path === '/admin/notice' && method === 'POST')
      state.notices.push({
        _id: `notice-${state.notices.length + 1}`,
        title: 'New notice',
        content: 'Community news',
        postedAt: '2026-11-15',
      });
    if (path === '/admin/notice/notice-1' && method === 'DELETE') state.notices = [];
    return respond({ success: true });
  });
  await page.route('**/clientportal/api/analytics/v1/events', async (route) => {
    state.events.push(route.request().postDataJSON());
    return route.fulfill({ status: 202, json: { ok: true } });
  });
  await page.route('**/clientportal/api/konnect/contact', async (route) => {
    state.contacts.push(route.request().postDataJSON());
    if (state.contactFailure)
      return route.fulfill({
        status: state.contactFailure,
        headers: { 'Retry-After': '60', 'Access-Control-Expose-Headers': 'Retry-After' },
        json: { error: 'Unavailable' },
      });
    await new Promise((resolve) => setTimeout(resolve, 100));
    return route.fulfill({ status: 201, json: { success: true } });
  });
  return state;
}

test('static homepage, contact destination, duplicate guard and analytics', async ({ page }) => {
  const state = await fixture(page);
  await page.goto('/');
  await expect(page.locator('.schedule-card')).toHaveCount(7);
  await expect(page.getByText('Live! It! Up!', { exact: true })).toBeVisible();
  await expect(page.locator('.navbar-brand')).toHaveCSS('color', 'rgb(252, 223, 3)');
  for (const name of ['mainphoto.png', 'mural.jpg', 'canteen.jpg']) {
    const photo = page.locator(`img[src="/static/${name}"]`);
    await photo.scrollIntoViewIfNeeded();
    await expect.poll(() => photo.evaluate((image) => image.naturalWidth)).toBeGreaterThan(0);
  }
  await expect.poll(() => state.events.length).toBe(1);
  expect(state.events[0].username).toBe('sandgateseniors');
  expect(state.contacts).toHaveLength(0);
  await page.locator('#contact-name').fill('Example Visitor');
  await page.locator('#contact-email').fill('visitor@example.com');
  await page.locator('#contact-subject').fill('Membership');
  await page.locator('#contact-message').fill('Please tell me about membership.');
  state.contactFailure = 429;
  await page.getByRole('button', { name: 'Send enquiry' }).click();
  await expect(page.getByRole('status')).toContainText('60 seconds');
  await expect(page.locator('#contact-name')).toHaveValue('Example Visitor');
  state.contactFailure = 0;
  await page.locator('.contact-form').evaluate((form) => {
    form.requestSubmit();
    form.requestSubmit();
  });
  await expect(page.getByRole('status')).toContainText('delivered');
  expect(state.contacts).toHaveLength(2);
  expect(state.contacts[1].username).toBe('sandgateseniors');
  await expect(page.locator('#contact-name')).toHaveValue('');
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('privacy opt out and unavailable services leave homepage usable', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'doNotTrack', { value: '1' }));
  const state = await fixture(page);
  await page.route('**/senior-citz/api/**', (route) => route.abort());
  await page.goto('/');
  await expect(page.locator('.schedule-card')).toHaveCount(7);
  await expect(page.locator('#noticeboard-posts')).toContainText('could not be loaded');
  expect(state.events).toHaveLength(0);
  await expect(page.getByRole('button', { name: 'Send enquiry' })).toBeEnabled();
});

test('public and admin pages fit small phones through desktop widths', async ({ page }) => {
  await fixture(page, { authenticated: true });
  for (const route of ['/', '/admin/login', '/admin/dashboard']) {
    await page.goto(route);
    if (route === '/') await expect(page.locator('.schedule-card')).toHaveCount(7);
    if (route === '/admin/dashboard') await expect(page.locator('.timetable-row')).toHaveCount(7);
    for (const width of [320, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      const layout = await page.evaluate(() => ({
        fits: document.documentElement.scrollWidth <= window.innerWidth,
        offenders: [...document.querySelectorAll('body *')]
          .filter((element) => element.getBoundingClientRect().right > window.innerWidth + 1)
          .slice(0, 6)
          .map((element) => `${element.tagName.toLowerCase()}.${element.className}`),
      }));
      expect(layout.fits, `${route} overflows at ${width}px: ${layout.offenders.join(', ')}`).toBe(
        true,
      );
      if (route === '/' && width === 390) {
        expect(
          await page
            .locator('.schedule-grid')
            .evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(' ').length),
        ).toBe(1);
        expect(
          await page
            .getByRole('link', { name: 'View Timetable' })
            .evaluate((element) => element.getBoundingClientRect().height),
        ).toBeGreaterThanOrEqual(44);
        await page.getByRole('button', { name: 'Toggle navigation' }).click();
        await expect(
          page.locator('#mainNavbar').getByRole('link', { name: 'About' }),
        ).toBeVisible();
      }
      if (route === '/' && width === 1440) {
        expect(
          await page
            .locator('.schedule-grid')
            .evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(' ').length),
        ).toBe(3);
      }
      if (route === '/admin/dashboard' && width === 390) {
        await page.getByRole('button', { name: 'Toggle navigation' }).click();
        await expect(
          page.locator('#mainNavbar').getByRole('link', { name: 'View Site' }),
        ).toBeVisible();
      }
    }
  }
});

test('session protection, failed login, token rotation, refresh and logout', async ({ page }) => {
  const state = await fixture(page);
  await page.goto('/admin/dashboard');
  await expect(page).toHaveURL(/\/admin\/login$/);
  await page.locator('#username').fill('test-admin');
  await page.locator('#password').fill('wrong');
  await page.getByRole('button', { name: 'Login', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Invalid credentials');
  await page.locator('#password').fill('test-password');
  await page.getByRole('button', { name: 'Login', exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/dashboard$/);
  await expect(page.locator('.timetable-row')).toHaveCount(7);
  expect(state.token).toBe(3);
  await page.reload();
  await expect(page.locator('#notice-form')).toBeVisible();
  // Submit directly to avoid the pre-existing desktop attribution overlapping the nav.
  await page
    .locator('form')
    .first()
    .evaluate((form) => form.requestSubmit());
  await expect(page).toHaveURL(/\/admin\/login$/);
  expect(state.authenticated).toBe(false);
});

test('retryable session error and admin write failures preserve forms without replay', async ({
  page,
}) => {
  const state = await fixture(page, { authenticated: true, sessionFailure: true });
  await page.goto('/admin-dashboard.html');
  await expect(page.getByRole('button', { name: 'Retry' })).toBeVisible();
  await expect(page.locator('#notice-form')).toHaveCount(0);
  state.sessionFailure = false;
  await page.getByRole('button', { name: 'Retry' }).click();
  await page.locator('#title').fill('New notice');
  await page.locator('#content').fill('Community news');
  state.rejectWrite = 403;
  await page.getByRole('button', { name: 'Save Notice' }).click();
  await expect(page.locator('#status-message')).toContainText('Please retry');
  await expect(page.locator('#title')).toHaveValue('New notice');
  expect(state.writes).toHaveLength(1);
  state.rejectWrite = 0;
  await page.getByRole('button', { name: 'Save Notice' }).click();
  await expect(page.locator('#title')).toHaveValue('');
  expect(state.writes).toHaveLength(2);
  await page.locator('#title').fill('Expired');
  await page.locator('#content').fill('Keep safe');
  state.rejectWrite = 401;
  await page.getByRole('button', { name: 'Save Notice' }).click();
  await expect(page).toHaveURL(/\/admin\/login$/);
});

test('notice editing, upload validation, deletion, timetable and registration transport', async ({
  page,
}) => {
  const state = await fixture(page, {
    authenticated: true,
    notices: [
      {
        _id: 'notice-1',
        title: 'Existing notice',
        content: 'Existing content',
        postedAt: '2026-11-15',
      },
    ],
  });
  await page.goto('/admin/dashboard');
  await expect(page.locator('[data-action="edit"]')).toHaveCount(1);
  await page.locator('[data-action="edit"]').evaluate((button) => button.click());
  await expect(page.locator('#title')).toHaveValue('Existing notice');
  await page.getByRole('button', { name: 'Save Notice' }).click();
  await expect.poll(() => state.writes.length).toBe(1);
  expect(state.writes[0].path).toBe('/admin/notice/notice-1');
  expect(state.writes[0].body).not.toContain('filename=');
  await page.locator('#title').fill('New notice');
  await page.locator('#content').fill('Community news');
  await page.locator('#image').setInputFiles({
    name: 'unsafe.svg',
    mimeType: 'image/svg+xml',
    buffer: Buffer.from('<svg/>'),
  });
  await page.getByRole('button', { name: 'Save Notice' }).click();
  await expect(page.locator('#status-message')).toContainText('up to 5 MiB');
  expect(state.writes).toHaveLength(1);
  await page.locator('#image').setInputFiles({
    name: 'large.png',
    mimeType: 'image/png',
    buffer: Buffer.alloc(5 * 1024 * 1024 + 1),
  });
  await page.getByRole('button', { name: 'Save Notice' }).click();
  expect(state.writes).toHaveLength(1);
  await page.locator('#image').setInputFiles({
    name: 'tiny.png',
    mimeType: 'image/png',
    buffer: Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=',
      'base64',
    ),
  });
  await page.getByRole('button', { name: 'Save Notice' }).click();
  await expect(page.locator('#title')).toHaveValue('');
  expect(state.writes[1].body).toContain('filename="tiny.png"');
  page.on('dialog', (dialog) => dialog.accept());
  await page
    .locator('[data-action="delete"]')
    .first()
    .evaluate((button) => button.click());
  await expect.poll(() => state.writes.length).toBe(3);
  await page.locator('#timetable-form').evaluate((form) => form.requestSubmit());
  await expect.poll(() => state.writes.length).toBe(4);
  expect(JSON.parse(state.writes[3].body).entries).toHaveLength(7);
  await page.locator('#register-form').evaluate((form) => {
    form.elements.username.value = 'new-admin';
    form.elements.password.value = 'long-test-password';
    form.requestSubmit();
  });
  await expect.poll(() => state.writes.length).toBe(5);
  expect(JSON.parse(state.writes[4].body).username).toBe('new-admin');
});
