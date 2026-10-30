import { Component, computed, inject, signal } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

interface Building {
  id: number;
  name: string;
  description: string;
  features: string;
  sourceUrl: string;
  sourceLabel: string;
  mapUrl: string;
  embedUrl: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  template: `
    <header>
      <h1>CampusAble</h1>
      <p>George Mason University · Fairfax campus</p>
    </header>
    <main>
      <h2>Find building information</h2>
      <p>Select a building to see its details and location on Google Maps.</p>
      <div class="master-detail">
        <section class="building-list" aria-labelledby="buildings-heading">
          <h3 id="buildings-heading">Campus buildings</h3>
          <ul>
            @for (building of buildings; track building.id) {
              <li>
                <button type="button"
                  [class.selected]="selectedBuilding().id === building.id"
                  [attr.aria-pressed]="selectedBuilding().id === building.id"
                  aria-controls="building-details campus-map"
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
          <p><strong>What you can find here:</strong> {{ selectedBuilding().features }}</p>
          <p class="source">Building information: <a [href]="selectedBuilding().sourceUrl" target="_blank" rel="noopener noreferrer">{{ selectedBuilding().sourceLabel }} (opens a new tab)</a></p>
          <div class="notice">
            <h4>Accessibility information</h4>
            <p>Entrance, elevator, and accessible restroom details are not yet verified. Live closure updates are not connected.</p>
          </div>
        </section>
      </div>
      <section id="campus-map" class="map-section" aria-labelledby="map-heading">
        <div class="map-heading">
          <h3 id="map-heading">Map · {{ selectedBuilding().name }}</h3>
          <a [href]="selectedBuilding().mapUrl" target="_blank" rel="noopener noreferrer">Open in Google Maps (new tab)</a>
        </div>
        <iframe [src]="mapSource()" [title]="'Google Maps location of ' + selectedBuilding().name"
          width="960" height="340" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>
      </section>
    </main>
    <footer>CampusAble | IT 390 | Sufyan Zelawar</footer>
  `
})
export class AppComponent {
  readonly buildings: Building[] = [
    {
      id: 1, name: 'Innovation Hall',
      description: 'An academic building with classrooms and spaces for group learning on the Fairfax campus.',
      features: 'Teaching spaces and an ITS computer lab in Room 301.',
      sourceUrl: 'https://its.gmu.edu/help-support/computer-labs-classrooms-information/',
      sourceLabel: 'Mason ITS computer labs',
      mapUrl: 'https://www.google.com/maps/search/?api=1&query=Innovation+Hall+George+Mason+University+Fairfax',
      embedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3108.173814132037!2d-77.30747079999999!3d38.82848!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89b64e60c9822067%3A0xd8ebbbeb00c2e454!2sInnovation%20Hall!5e0!3m2!1sen!2sus!4v1793335483243!5m2!1sen!2sus'
    },
    {
      id: 2, name: 'Johnson Center (JC)',
      description: 'A central place for students to eat, study, meet friends, and attend events between classes.',
      features: 'Dining options, study rooms, lounges, and event spaces.',
      sourceUrl: 'https://studentcenters.gmu.edu/the-johnson-center/',
      sourceLabel: 'Mason Student Centers',
      mapUrl: 'https://www.google.com/maps/search/?api=1&query=Johnson+Center+George+Mason+University+Fairfax',
      embedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3108.1147183463754!2d-77.30734079999999!3d38.82983349999999!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89b64f49a1a1542d%3A0xa6e4f7c1cc8c47f6!2sJohnson%20Center!5e0!3m2!1sen!2sus!4v1793335526875!5m2!1sen!2sus'
    },
    {
      id: 3, name: 'Horizon Hall',
      description: 'An academic building with active learning classrooms designed for discussion and group work.',
      features: 'Classrooms with flexible learning spaces and technology for collaborative activities.',
      sourceUrl: 'https://learningenvironments.gmu.edu/signature-learning-spaces/',
      sourceLabel: 'Mason Learning Environments',
      mapUrl: 'https://www.google.com/maps/search/?api=1&query=Horizon+Hall+George+Mason+University+Fairfax',
      embedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3108.0524159314573!2d-77.3076116!3d38.8312604!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89b64f94d152886d%3A0x926da2556950cf3a!2sHorizon%20Hall!5e0!3m2!1sen!2sus!4v1793335565904!5m2!1sen!2sus'
    },
    {
      id: 4, name: 'Fenwick Library',
      description: 'George Mason’s main research library, with study spaces, library collections, and research support.',
      features: 'Group study rooms, the Research Commons, and the Special Collections Research Center.',
      sourceUrl: 'https://library.gmu.edu/locations/fenwick',
      sourceLabel: 'Mason University Libraries',
      mapUrl: 'https://www.google.com/maps/search/?api=1&query=Fenwick+Library+George+Mason+University+Fairfax',
      embedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3108.0147296539417!2d-77.30714379999999!3d38.8321235!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89b64e5de5e701f3%3A0x7bbc5c6b065f984a!2sFenwick%20Library!5e0!3m2!1sen!2sus!4v1793335605049!5m2!1sen!2sus'
    }
  ];
  readonly selectedBuilding = signal<Building>(this.buildings[0]);
  private readonly sanitizer = inject(DomSanitizer);
  // Only the fixed Google Maps embed URLs above are trusted as iframe sources.
  readonly mapSource = computed(() =>
    this.sanitizer.bypassSecurityTrustResourceUrl(this.selectedBuilding().embedUrl)
  );
  selectBuilding(building: Building): void {
    this.selectedBuilding.set(building);
  }
}
