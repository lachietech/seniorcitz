# Sandgate Seniors

React frontend built with Vite for static hosting. Notices, timetable, uploads and administrator operations use the Nielsen Innovations Sandgate API. VisitPulse records page views for `sandgateseniors`; the homepage contact form delivers enquiries to that account's Konnect inbox.

## Development and deployment

Use Node.js 22.12+ or 24+. Run `npm ci`, then `npm run dev`. Copy `.env.example` to `.env.local` to override public defaults. Vite loads environment files from the repository root. Never put database credentials or server secrets in `VITE_*` variables. An old local `.env` is not needed and must never be deployed.

Run `npm run build` and publish **only `dist/`**. No Sandgate Node server or database is required. `npm start` is a local static preview. Existing backend files and historical migration tests remain for reference/rollback; they are excluded from the build and active test command.

The build includes CSS, images, three HTML entry points, directory indexes for `/admin/login/` and `/admin/dashboard/`, and a Netlify-compatible `_redirects` file. Configure other hosts to rewrite `/admin/login` to `/admin-login.html` and `/admin/dashboard` to `/admin-dashboard.html`. Serve `/` from `index.html`, retaining direct `.html` URLs. Never rewrite API or missing asset requests to HTML.

For local Nielsen development, set `VITE_SENIOR_CITZ_API_URL=/senior-citz/api`; Vite proxies it to port 5000. Default requests go directly to the deployed Nielsen API. Rebuild after environment changes.

## Nielsen operator setup and cutover

1. Back up Sandgate's database. Configure Nielsen's `MONGO_URI_SENIOR_CITZ` with that database, retaining existing collections and password hashes. The deployed notices and timetable endpoints returned HTTP 200 with existing data during this migration; deployment secrets were not inspected.
2. Append exact Sandgate production/preview origins to Nielsen's `TRUSTED_ORIGINS`. Configure HTTPS cookies and proxy trust per the supplied senior citz pack. Verify admin login, reload, uploads and logout in staging.
3. Browsers may block cross-site cookies. Prefer a same-site API hostname or a real hosting reverse proxy for `/senior-citz/api/*` preserving bodies, methods, cookies and Set-Cookie. Set the frontend API URL accordingly. An HTML rewrite is not a reverse proxy.
4. Confirm the portal account `sandgateseniors` is active. Append its exact origins to the existing `VISITPULSE_SITES` backend JSON map, preserving other customers. Add an entry shaped like `"sandgateseniors": ["https://YOUR-ACTUAL-SANDGATE-HOST"]`. No production hostname was supplied, so registration/account verification remain operator steps. VisitPulse registration is separate from privileged API CORS.
5. Konnect requires only an active recipient; no origin registration or form key. Enquiries appear at `https://personal-website-53mf.onrender.com/clientportal/konnect`. No email notifications are sent. Verify a labelled enquiry in the recipient inbox when authorized.
6. Analytics reports are at `https://personal-website-53mf.onrender.com/clientportal/visitpulse`, signed in as `sandgateseniors`. Verify HTTP 202 collection and report ownership with a second staging account. Automated checks send no live contact messages or analytics events.
7. If hosting sets CSP, allow selected API origins in `connect-src`, existing Bootstrap CDN resources, and `data:`/`blob:` notice images/previews. Deploy `dist` after staging verification. Keep the prior deployment for rollback; avoid simultaneous admin edits during cutover.

## Privacy and failures

VisitPulse starts once per document outside React renders. Navigation loads full documents, so no SPA hook is required. Tracking omits credentials, respects GPC/DNT, uses a tab-scoped identifier and strips query/fragment information. Form values are never tracked. Set `VITE_VISITPULSE_ENABLED=false` to disable it.

Contact submission uses the supplied client, an immediate duplicate guard, field validation and accessible status messages. Fields clear only on confirmed HTTP 201 success. Rate limits show wait guidance; uncertain delivery is never retried automatically.

Admin requests include cookies and CSRF. Login refreshes CSRF after session rotation; expired sessions redirect to login. Rejected tokens refresh without replaying writes. Session-check failures offer retry. Public timetable failure uses fallback data; admin load failures do not populate editable fallback rows that could overwrite stored data.

## Verification

`npm test` builds and runs `tests/static.spec.js` against isolated mocked remote APIs. `npm run test:dev` runs the same checks through Vite development serving. Microsoft Edge is the default browser; override with `PLAYWRIGHT_CHANNEL` if needed. The Konnect pack also includes offline client tests.

Live admin workflows, backend authorization/CSRF enforcement, cookie persistence, analytics storage/account isolation and mailbox delivery require staging/operator verification. Mock tests do not establish those properties. These changes do not deploy the frontend or retire the existing service.

Validation recorded: production build succeeded; all five browser scenarios passed against both static preview and development serving; five Konnect offline client tests passed. On this Windows environment Playwright remained running during server teardown after reporting the passing scenarios and was stopped manually. Live notices and timetable GETs returned HTTP 200; no production writes were made.
