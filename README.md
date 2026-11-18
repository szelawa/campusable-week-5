# CampusAble — Sprint 2

Angular frontend based on Gio Pilande's CampusAble redesign, with a Node.js API for reporting and reviewing building issues. All closure notices are demo data, not official university alerts.

## Run locally

Use Node.js 24 or 26. Run `npm ci`, copy `.env.example` to `.env`, then set the Google web client ID and comma-separated approved admin emails. Run `npm run build` followed by `npm start`. Open http://localhost:8082. Local records are stored in `.data/records.json` (excluded from Git).

For frontend development, run the API with `npm start` and Angular with `npm run dev` in another terminal. Add the frontend origin to Google's authorized JavaScript origins if testing login there.

## Demo

1. Select Innovation Hall and scroll to Building updates.
2. Expand Report an issue, choose Elevator and submit a sample description.
3. Expand Admin review and sign in with an approved Google account.
4. Publish the pending report as a demo notice.
5. Open the same building in another browser. It refreshes notices every ten seconds; Refresh updates also works immediately.
6. Clear the notice as admin. Check that it disappears in the other browser.

Reports remain private until published. Admin API requests verify Google ID tokens and the server-side email allowlist. Tokens stay in browser memory; reloading requires signing in again. Saved places and display preferences remain browser-local.

## Backend

- GET /api/buildings
- GET /api/buildings/:id/closures
- POST /api/reports
- GET /api/admin/me (admin)
- GET /api/reports (admin)
- POST /api/closures with reportId (admin)
- PATCH /api/reports/:id with status dismissed (admin)
- PATCH /api/closures/:id with status resolved (admin)

The server supports a local JSON store and Firestore. Firestore uses one transactional document for the bounded classroom demo; split reports and closures into collections before expanding beyond this prototype. Demo reports are capped at 500. The local request limiter is per process, not a distributed abuse-prevention service.

## Google Cloud deployment

This branch is not deployed. Create a Firestore Native mode database and give the runtime service account the database access it needs. Set GOOGLE_CLIENT_ID and ADMIN_EMAILS in app.yaml alongside STORAGE=firestore. Add the exact public HTTPS origin to the Google OAuth client, then deploy with `gcloud app deploy`. The server refuses local-file storage on App Engine or Cloud Run. No credential keys belong in this repository.

The existing map uses Gio's MapTiler configuration. Check that its key permits the deployment domain. Directions open Google Maps; this app does not calculate verified accessible routes.

## Checks

Run `npm test` and `npm run build`. Backend tests use a test-only injected token verifier, not a production authentication bypass. Real Google login and Firestore require separate integration checks.

The former GitHub Pages workflow is retained under `.github/previous-workflows` for reference. Pages alone does not run this backend.

## Current verification limits

The local API tests and production build pass. Browser report submission and the Google sign-in button were checked. Real admin sign-in and Firestore persistence have not yet been verified in this branch. Dependency auditing reports inherited Angular tooling issues and transitive Zod/UUID advisories; resolve or assess these before public deployment.
