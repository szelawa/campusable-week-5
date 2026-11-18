# CampusAble Fairfax Campus

IT 390 project by Sufyan Zelawar.

The Angular page lists Innovation Hall, the Johnson Center (JC), Horizon Hall, and Fenwick Library. Selecting a building updates its description, useful features, official information link, and embedded Google Maps location.

## Run locally

The app now has two parts: the Angular front end and a small Node.js backend. Run each one in its own Terminal window.

```bash
npm install
npm run server   # Terminal 1: backend API on http://127.0.0.1:3000
npm start        # Terminal 2: Angular front end on http://localhost:4200
```

Open http://localhost:4200 and keep both Terminals running. The Angular dev server forwards every `/api` request to the backend (see `proxy.conf.json`). After the first installation, only `npm start` is needed. Stop the server with Control+C. Use a Node version supported by Angular 22. Do not open src/index.html directly; Angular needs the server to compile the TypeScript.

## Main files

- `src/app/app.component.ts`: building records, HTML template, selection logic, and Google Maps embeds.
- `src/styles.css`: simple blue theme and layout for desktop and mobile.
- `src/main.ts`: starts the Angular application.
- `server/server.js`: the backend REST API (Node.js built-in modules only, no extra packages).
- `server/data/buildings.json`: the four building records, moved out of the component.
- `server/server.test.js`: automated backend tests (`npm run test:server`).

The component loads the buildings from `GET /api/buildings`. The `selectedBuilding` signal stores the selected record, and selecting a building also loads its active closures. The computed `mapSource` changes the iframe URL when the selection changes. Embed URLs come from Google Maps' Share > Embed a map feature. This version needs internet access for the maps but does not use an API key. An external Google Maps link remains available if an embed does not load.

## Information sources

Building descriptions were checked on October 30, 2026:

- Innovation Hall: [Mason ITS computer labs](https://its.gmu.edu/help-support/computer-labs-classrooms-information/) and [Mason learning spaces](https://learningenvironments.gmu.edu/signature-learning-spaces/).
- Johnson Center: [Mason Student Centers](https://studentcenters.gmu.edu/the-johnson-center/).
- Horizon Hall: [Mason Learning Environments](https://learningenvironments.gmu.edu/signature-learning-spaces/).
- Fenwick Library: [Mason University Libraries](https://library.gmu.edu/locations/fenwick).

These sources describe the buildings. They do not verify accessible travel routes. Entrance, elevator, and accessible restroom details remain unverified. The old fictional closure notices were removed. Closures are now posted by an admin through the backend; none are included by default.

## Backend API

| Method | Endpoint | Who | What it does |
|---|---|---|---|
| GET | /api/health | Anyone | Checks that the server is running |
| GET | /api/buildings | Anyone | Lists the four buildings |
| GET | /api/buildings/:id | Anyone | One building's details |
| GET | /api/buildings/:id/closures | Anyone | Active closures for that building |
| GET | /api/closures | Admin | Every closure, including cleared ones |
| POST | /api/closures | Admin | Posts a closure: `{ "buildingId": 2, "message": "...", "endsAt": "optional date" }` |
| DELETE | /api/closures/:id | Admin | Clears a closure (kept as history) |

Admin requests need the header `Authorization: Bearer <ADMIN_TOKEN>`. To turn admin updates on, copy `server/.env.example` to `server/.env` and set your own long token. `server/.env` is ignored by Git, so the token is never uploaded. In the app, open "Admin: post or clear a closure" under a building and enter the token.

Closures are saved in `server/data/closures.json` (also ignored by Git). This file storage works on your own computer. Google App Engine and Cloud Run do not keep files between restarts, so a deployed version would need a database for closures.

For a single deployed app, run `npm run build` and then `npm run server`: the backend also serves the built front end from `dist/campusable/browser`.

## Build and check

```bash
npm run build
npm run test:server
```

1. Innovation Hall is selected initially.
2. Select each of the four buildings. Confirm that its heading, description, source link, map heading, and map location change together.
3. Select buildings using Tab and Enter.
4. Check the layout on a narrow screen; the details should appear below the list.
5. Confirm that the Google Maps and Mason source links open the selected building's information.
6. With the backend running and an admin token set, post a closure for a building. Confirm it appears for that building only, then clear it.

Keep node_modules, dist, .angular, and .DS_Store out of the source submission.
