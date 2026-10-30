# CampusAble Fairfax Campus

IT 390 project by Sufyan Zelawar.

The Angular page lists Innovation Hall, the Johnson Center (JC), Horizon Hall, and Fenwick Library. Selecting a building updates its description, useful features, official information link, and embedded Google Maps location.

## Run locally

```bash
npm install
npm start
```

Open http://localhost:4200 and keep Terminal running. After the first installation, only `npm start` is needed. Stop the server with Control+C. Use a Node version supported by Angular 22. Do not open src/index.html directly; Angular needs the server to compile the TypeScript.

## Main files

- `src/app/app.component.ts`: building records, HTML template, selection logic, and Google Maps embeds.
- `src/styles.css`: simple blue theme and layout for desktop and mobile.
- `src/main.ts`: starts the Angular application.

The `selectedBuilding` signal stores the selected record. The computed `mapSource` changes the iframe URL when the selection changes. Embed URLs come from Google Maps' Share > Embed a map feature. This version needs internet access for the maps but does not use an API key. An external Google Maps link remains available if an embed does not load.

## Information sources

Building descriptions were checked on October 30, 2026:

- Innovation Hall: [Mason ITS computer labs](https://its.gmu.edu/help-support/computer-labs-classrooms-information/) and [Mason learning spaces](https://learningenvironments.gmu.edu/signature-learning-spaces/).
- Johnson Center: [Mason Student Centers](https://studentcenters.gmu.edu/the-johnson-center/).
- Horizon Hall: [Mason Learning Environments](https://learningenvironments.gmu.edu/signature-learning-spaces/).
- Fenwick Library: [Mason University Libraries](https://library.gmu.edu/locations/fenwick).

These sources describe the buildings. They do not verify accessible travel routes. Entrance, elevator, and accessible restroom details remain unverified. The old fictional closure notices were removed. Backend routing, live closures, and administrator updates are not implemented.

## Build and check

```bash
npm run build
```

1. Innovation Hall is selected initially.
2. Select each of the four buildings. Confirm that its heading, description, source link, map heading, and map location change together.
3. Select buildings using Tab and Enter.
4. Check the layout on a narrow screen; the details should appear below the list.
5. Confirm that the Google Maps and Mason source links open the selected building's information.

Keep node_modules, dist, .angular, and .DS_Store out of the source submission.
