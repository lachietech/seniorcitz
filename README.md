# Sandgate Seniors

React frontend built with Vite for static hosting. Notices, timetable, uploads and administrator operations use the Nielsen Innovations Sandgate API. VisitPulse records page views for `sandgateseniors`; the homepage contact form delivers enquiries to that account's Konnect inbox.

## Development and deployment

Use Node.js 22.12+ or 24+. Run `npm ci`, then `npm run dev`. Set public overrides in `.env.local` if needed. Vite loads environment files from the repository root. Never put database credentials or server secrets in `VITE_*` variables. Do not deploy local environment files.

Run `npm run build` and publish **only `dist/`**. No Sandgate Node server or database is required. `npm start` is a local static preview.

The build includes locally bundled Bootstrap, CSS, images, three HTML entry points, directory indexes for `/admin/login/` and `/admin/dashboard/`, and a Netlify-compatible `_redirects` file. Configure other hosts to rewrite `/admin/login` to `/admin-login.html` and `/admin/dashboard` to `/admin-dashboard.html`. Serve `/` from `index.html`, retaining direct `.html` URLs. Never rewrite API or missing asset requests to HTML.

The colour palette and typography are defined in `frontend/static/css/brand.css`. The site uses a gold text wordmark and a simple lettermark favicon until the official logo is supplied. The homepage uses the original welcome photo in the blue hero, with canteen and mural photos in the combined About section. The slogan is "Live! It! Up!" in gold. `Style Script` is bundled locally for the slogan, with its licence in `frontend/static/fonts/OFL.txt`; browsers use a cursive fallback when it is unavailable. The content below the hero shares a light background with soft blue and gold accents.

Requests go directly to the deployed Nielsen API by default. Set `VITE_SENIOR_CITZ_API_URL` to another reachable API URL when needed, then rebuild.

## External services

The browser calls Nielsen's Sandgate API for notices, timetable and administrator actions. The API must allow the site's deployed origin and support HTTPS cookies for administrator sessions. Cross-site cookies may be blocked; a same-site API hostname or reverse proxy can help. An HTML rewrite cannot proxy API requests.

The contact form sends enquiries to the `sandgateseniors` Konnect inbox. VisitPulse records page views for that account when enabled. Configure the deployed origin in the external services as needed. If hosting sets a CSP, allow the API origins in `connect-src` and `data:`/`blob:` notice images and previews.

## Privacy and failures

VisitPulse starts once per document outside React renders. Navigation loads full documents, so no SPA hook is required. Tracking omits credentials, respects GPC/DNT, uses a tab-scoped identifier and strips query/fragment information. Form values are never tracked. Set `VITE_VISITPULSE_ENABLED=false` to disable it.

Contact submission uses the supplied client, an immediate duplicate guard, field validation and accessible status messages. Fields clear only on confirmed HTTP 201 success. Rate limits show wait guidance; uncertain delivery is never retried automatically.

Admin requests include cookies and CSRF. Login refreshes CSRF after session rotation; expired sessions redirect to login. Rejected tokens refresh without replaying writes. Session-check failures offer retry. Public timetable failure uses fallback data; admin load failures do not populate editable fallback rows that could overwrite stored data.

## Verification

`npm run format` formats the frontend and Vite configuration; `npm run format:check` checks their style. `npm test` builds and runs `tests/static.spec.js` against isolated mocked remote APIs. `npm run test:dev` runs the same checks through Vite development serving. Microsoft Edge is the default browser; override with `PLAYWRIGHT_CHANNEL` if needed.

Live admin workflows, API authorization/CSRF enforcement, cookie persistence, analytics storage and mailbox delivery require verification against the deployed external services. Mock tests do not establish those properties.
