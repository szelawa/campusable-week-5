import { Component, signal } from '@angular/core';

interface Building {
  id: number;
  name: string;
  description: string;
  entrance: string;
  elevator: string;
  restroom: string;
  note: string;
  closure: boolean;
}

@Component({
  selector: 'app-root',
  standalone: true,
  template: `
    <header>
      <h1>CampusAble</h1>
      <p>Building Accessibility</p>
    </header>

    <main>
      <h2>Find building information</h2>
      <p>Select a building to see its accessible entrance and available features.</p>
      <p class="sample-notice">Class project: all building information below is sample data, not verified campus guidance.</p>

      <div class="master-detail">
        <section class="building-list" aria-labelledby="buildings-heading">
          <h3 id="buildings-heading">Campus buildings</h3>
          <ul>
            @for (building of buildings; track building.id) {
              <li>
                <button type="button"
                  [class.selected]="selectedBuilding().id === building.id"
                  [attr.aria-pressed]="selectedBuilding().id === building.id"
                  aria-controls="building-details"
                  (click)="selectBuilding(building)">
                  {{ building.name }}
                </button>
              </li>
            }
          </ul>
        </section>

        <section id="building-details" class="details" aria-live="polite" aria-atomic="true" aria-labelledby="details-heading">
          <h3 id="details-heading">{{ selectedBuilding().name }}</h3>
          <p>{{ selectedBuilding().description }}</p>
          <dl>
            <dt>Accessible entrance</dt>
            <dd>{{ selectedBuilding().entrance }}</dd>
            <dt>Elevator</dt>
            <dd>{{ selectedBuilding().elevator }}</dd>
            <dt>Accessible restroom</dt>
            <dd>{{ selectedBuilding().restroom }}</dd>
          </dl>
          <div class="notice" [class.closure]="selectedBuilding().closure">
            <h4>{{ selectedBuilding().closure ? 'Sample closure notice' : 'Sample access note' }}</h4>
            <p>{{ selectedBuilding().note }}</p>
          </div>
        </section>
      </div>
    </main>

    <footer>CampusAble | IT 390 | Sufyan Zelawar</footer>
  `
})
export class AppComponent {
  readonly buildings: Building[] = [
    {
      id: 1, name: 'Library',
      description: 'Study spaces, books, and computer labs.',
      entrance: 'East entrance beside the courtyard. Includes a ramp and automatic doors.',
      elevator: 'Available beside the main desk. Serves all three floors.',
      restroom: 'First floor, across from the elevator.',
      note: 'Use the east entrance for step-free access. The front steps are on the west side.',
      closure: false
    },
    {
      id: 2, name: 'Student Center',
      description: 'Dining, student services, and meeting rooms.',
      entrance: 'South entrance facing the bus stop. Level entry with automatic doors.',
      elevator: 'Available near the information desk. Serves both floors.',
      restroom: 'Ground floor, next to the dining area.',
      note: 'The south entrance connects directly to the main hallway.',
      closure: false
    },
    {
      id: 3, name: 'Science Hall',
      description: 'Science classrooms and teaching laboratories.',
      entrance: 'North entrance beside the parking area. A ramp leads to the main doors.',
      elevator: 'Unavailable in this sample scenario. Upper floors cannot be reached step-free.',
      restroom: 'Ground floor, near room 102.',
      note: 'Elevator maintenance affects upper-floor access. Contact campus accessibility services to arrange an alternative.',
      closure: true
    },
    {
      id: 4, name: 'Arts Building',
      description: 'Art studios, music rooms, and a small gallery.',
      entrance: 'North entrance facing the courtyard. Includes automatic doors.',
      elevator: 'Available at the end of the main hallway. Serves both floors.',
      restroom: 'First floor, beside the gallery.',
      note: 'The courtyard path provides step-free access to the north entrance.',
      closure: false
    },
    {
      id: 5, name: 'Administration',
      description: 'Admissions, registration, and other campus offices.',
      entrance: 'South entrance beside visitor parking. Level entry with automatic doors.',
      elevator: 'Available behind the reception area. Serves both floors.',
      restroom: 'First floor, across from reception.',
      note: 'The west entrance is closed in this sample scenario. Use the south entrance instead.',
      closure: true
    }
  ];

  readonly selectedBuilding = signal<Building>(this.buildings[0]);

  selectBuilding(building: Building): void {
    this.selectedBuilding.set(building);
  }
}
