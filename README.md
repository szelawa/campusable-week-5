# CampusAble Building Accessibility

IT 390 Week 5 project by Sufyan Zelawar.

This Angular application uses a master-detail interface. The building list is the master view. Selecting a building updates its entrance, elevator, restroom, and access notice in the detail view without leaving the page. All entries are fictional sample data and must not be used for real campus travel.

## Run locally

Open Terminal in the project folder, then run:

```bash
npm install
npm start
```

Open http://localhost:4200 in your browser. Keep Terminal running while using the app. Press Control+C in Terminal to stop it. After the first installation, only `npm start` is needed. Use Node 26 or another Node version supported by Angular 22.

Do not open src/index.html directly. Angular needs the development server to compile the TypeScript.

## Main files

- `src/app/app.component.ts`: building data, selection method, and HTML template. This is the main component for the portfolio attachment.
- `src/styles.css`: basic colors and responsive layout.
- `src/main.ts`: starts the Angular application.

`selectedBuilding` stores the current selection as an Angular signal. The `@for` block creates a button for each building. A button click calls `selectBuilding`, and Angular updates the details automatically.

## Build

```bash
npm run build
```

## Interface checks

1. The Library is selected when the page opens.
2. Select each of the five buildings and check that all details change.
3. Science Hall shows a sample elevator outage; Administration shows a sample entrance closure.
4. Return to the Library and check that the closure notice is replaced by its access note.
5. Use Tab and Enter to select a building with the keyboard.
6. On a narrow screen, the details appear below the building list.

## Portfolio description

CampusAble Building Accessibility helps students look up accessibility information for campus buildings. The left side shows a list of buildings. When someone clicks a building, the right side shows its accessible entrance, elevator information, restroom location, and any access notice. The details change on the same page, so users can check different buildings without opening a new page each time. This version uses sample information to demonstrate how the interface works.

## Submission checklist

- Review the code and test the interface.
- Capture a screenshot of the running application.
- Attach `src/app/app.component.ts` as the main component file.
- Upload the project source and package-lock.json to your GitHub repository, then include its link in the portfolio. Do not upload node_modules, dist, or .angular.
- Complete the assigned Angular training and include the actual completion certificate.

This project uses Angular 22 standalone components. Its setup differs from the older Angular tutorial, but it implements the same list-selection and detail-display pattern.
