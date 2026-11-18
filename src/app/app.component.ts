import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  NgZone,
  OnDestroy,
  ViewChild,
  computed,
  effect,
  inject,
  signal,
} from "@angular/core";
import { ClosurePanelComponent } from "./closure-panel.component";
import * as L from "leaflet";
import { IconComponent } from "./icon.component";
import {
  BUILDINGS,
  CAMPUSES,
  Building,
  CampusId,
  Category,
} from "./campus-data";
import { directionsUrl, filterBuildings, readSavedIds } from "./campus-utils";

type View = "explore" | "saved" | "accessibility" | "resources";
type Preferences = {
  contrast: boolean;
  largeText: boolean;
  reduceMotion: boolean;
};

@Component({
  selector: "app-root",
  standalone: true,
  imports: [IconComponent, ClosurePanelComponent],
  templateUrl: "./app.component.html",
})
export class AppComponent implements AfterViewInit, OnDestroy {
  @ViewChild("mapElement") mapElement!: ElementRef<HTMLDivElement>;
  @ViewChild("placeDialog") placeDialog!: ElementRef<HTMLDialogElement>;
  readonly buildings = signal<Building[]>(BUILDINGS);
  readonly campuses = CAMPUSES;
  readonly categories: Category[] = [
    "All places",
    "Academic",
    "Libraries",
    "Student life",
  ];
  readonly activeView = signal<View>("explore");
  readonly campusId = signal<CampusId>("fairfax");
  readonly campus = computed(
    () => CAMPUSES.find((c) => c.id === this.campusId())!,
  );
  readonly campusBuildings = computed(() =>
    this.buildings().filter((b) => b.campusId === this.campusId()),
  );
  readonly query = signal("");
  readonly category = signal<Category>("All places");
  readonly selectedBuilding = signal<Building | undefined>(BUILDINGS[1]);
  readonly savedIds = signal(
    readSavedIds(this.readStorage("campusable-saved"), BUILDINGS),
  );
  readonly filteredBuildings = computed(() =>
    filterBuildings(
      this.buildings(),
      this.campusId(),
      this.query(),
      this.category(),
      this.activeView() === "saved" ? this.savedIds() : undefined,
    ),
  );
  readonly preferences = signal<Preferences>(this.loadPreferences());
  readonly listView = signal(false);
  readonly mobileMenu = signal(false);
  readonly toast = signal("");
  readonly tileError = signal(false);
  readonly locating = signal(false);
  readonly dialogType = signal<"details" | "directions">("details");
  readonly origin = signal("");
  readonly userLocation = signal<[number, number] | undefined>(undefined);
  readonly routeError = signal("");
  readonly directionLink = computed(() => {
    const destination = this.selectedBuilding();
    if (!destination) return "";
    const start =
      this.origin() === "location"
        ? this.userLocation()
        : this.buildings().find((p) => String(p.id) === this.origin());
    return directionsUrl(destination, start);
  });
  private map?: L.Map;
  private markers?: L.LayerGroup;
  private locationMarker?: L.CircleMarker;
  private resizeObserver?: ResizeObserver;
  private toastTimeout?: ReturnType<typeof setTimeout>;
  private readonly zone = inject(NgZone);

  constructor() {
    fetch("/api/buildings").then(r => { if(!r.ok) throw Error(); return r.json(); }).then((data: Building[]) => {this.buildings.set(data);this.syncSelection();}).catch(() => this.notify("Building server unavailable. Showing the bundled building list; reports and updates may be unavailable."));
    effect(() => {
      const places = this.filteredBuildings();
      const selected = this.selectedBuilding();
      if (this.map) this.renderMarkers(places, selected);
    });
    effect(() => {
      const prefs = this.preferences();
      document.documentElement.classList.toggle(
        "high-contrast",
        prefs.contrast,
      );
      document.documentElement.classList.toggle("large-text", prefs.largeText);
      document.documentElement.classList.toggle(
        "reduce-motion",
        prefs.reduceMotion,
      );
    });
  }

  ngAfterViewInit() {
    this.map = L.map(this.mapElement.nativeElement, {
      zoomControl: false,
      scrollWheelZoom: false,
      attributionControl: true,
      minZoom: 5,
      maxZoom: 19,
    }).setView(this.campus().center, this.campus().zoom);

    const tiles = L.tileLayer(
      "https://api.maptiler.com/maps/streets-v4/{z}/{x}/{y}.png?key=MWmEAl1RwbigPH47HYhO",
      {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a> ' +
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
      },
    ).addTo(this.map);

    tiles.on("tileerror", () => this.zone.run(() => this.tileError.set(true)));
    tiles.on("tileload", () => this.zone.run(() => this.tileError.set(false)));
    this.markers = L.layerGroup().addTo(this.map);
    this.renderMarkers(this.filteredBuildings(), this.selectedBuilding());
    this.resizeObserver = new ResizeObserver(() => this.map?.invalidateSize());
    this.resizeObserver.observe(this.mapElement.nativeElement);
  }

  ngOnDestroy() {
    this.resizeObserver?.disconnect();
    this.map?.remove();
    clearTimeout(this.toastTimeout);
  }

  private renderMarkers(places: Building[], selected?: Building) {
    this.markers?.clearLayers();
    for (const place of places) {
      const active = selected?.id === place.id;
      const icon = L.divIcon({
        className: "campus-marker-wrapper",
        html: `<span class="campus-marker ${active ? "is-selected" : ""}">${place.code}</span>`,
        iconSize: [38, 44],
        iconAnchor: [19, 44],
      });
      const marker = L.marker(place.coordinates, {
        icon,
        title: place.name,
        alt: `View ${place.name}`,
        keyboard: true,
        zIndexOffset: active ? 1000 : 0,
      });
      marker.bindTooltip(place.name, {
        permanent: active,
        direction: "right",
        offset: [17, -26],
        className: "building-tooltip",
      });
      marker.on("click", () =>
        this.zone.run(() => this.selectBuilding(place, false)),
      );
      marker.addTo(this.markers!);
      marker.getElement()?.setAttribute("aria-label", "View " + place.name);
    }
  }

  navigate(view: View) {
    this.activeView.set(view);
    this.mobileMenu.set(false);
    this.query.set("");
    this.category.set("All places");
    this.syncSelection();
    queueMicrotask(() =>
      document.getElementById("main-content")?.focus({ preventScroll: true }),
    );
    if (view === "explore" || view === "saved")
      setTimeout(() => this.map?.invalidateSize(), 0);
  }

  @HostListener("document:keydown.escape")
  closeMobileMenu() {
    if (!this.mobileMenu()) return;
    this.mobileMenu.set(false);
    queueMicrotask(() =>
      document.querySelector<HTMLButtonElement>(".mobile-menu-button")?.focus(),
    );
  }
  changeCampus(value: string) {
    if (!CAMPUSES.some((c) => c.id === value)) return;
    this.campusId.set(value as CampusId);
    this.query.set("");
    this.category.set("All places");
    this.origin.set("");
    this.selectedBuilding.set(this.filteredBuildings()[0]);
    this.map?.setView(this.campus().center, this.campus().zoom, {
      animate: false,
    });
  }
  search(value: string) {
    this.query.set(value);
    this.syncSelection();
  }
  setCategory(value: Category) {
    this.category.set(value);
    this.syncSelection();
  }
  clearFilters() {
    this.query.set("");
    this.category.set("All places");
    this.syncSelection();
  }
  private syncSelection() {
    if (
      !this.filteredBuildings().some(
        (b) => b.id === this.selectedBuilding()?.id,
      )
    )
      this.selectedBuilding.set(this.filteredBuildings()[0]);
  }
  selectBuilding(place: Building, pan = true) {
    this.selectedBuilding.set(place);
    if (pan && this.map)
      this.map.panTo(place.coordinates, { animate: !this.reducedMotion() });
  }
  categoryIcon(category: string) {
    return category === "Libraries"
      ? "book"
      : category === "Student life"
        ? "coffee"
        : "building";
  }
  isSaved(place: Building) {
    return this.savedIds().includes(place.id);
  }
  toggleSaved(place: Building) {
    const removing = this.isSaved(place);
    this.savedIds.update((ids) =>
      removing ? ids.filter((id) => id !== place.id) : [...ids, place.id],
    );
    const persisted = this.writeStorage(
      "campusable-saved",
      JSON.stringify(this.savedIds()),
    );
    this.notify(
      persisted
        ? removing
          ? "Place removed from saved places"
          : "Place saved for your next visit"
        : "Updated for this visit. Your browser could not save the change.",
    );
    if (this.activeView() === "saved") {
      if (removing && this.placeDialog?.nativeElement.open) this.closeDialog();
      this.syncSelection();
    }
  }
  setListView(value: boolean) {
    this.listView.set(value);
    setTimeout(() => this.map?.invalidateSize(), 0);
  }
  zoom(delta: number) {
    if (delta > 0) this.map?.zoomIn();
    else this.map?.zoomOut();
  }
  resetMap() {
    this.map?.setView(this.campus().center, this.campus().zoom, {
      animate: !this.reducedMotion(),
    });
  }
  retryMap() {
    this.tileError.set(false);
    this.map?.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) layer.redraw();
    });
  }
  locate(forDirections = false) {
    this.routeError.set("");
    if (!navigator.geolocation) {
      this.locationFailure(
        "Location is unavailable in this browser. Choose a building as your starting point.",
      );
      return;
    }
    this.locating.set(true);
    navigator.geolocation.getCurrentPosition(
      (position) =>
        this.zone.run(() => {
          const coordinates: [number, number] = [
            position.coords.latitude,
            position.coords.longitude,
          ];
          this.userLocation.set(coordinates);
          this.locating.set(false);
          if (forDirections) this.origin.set("location");
          else {
            this.locationMarker?.remove();
            this.locationMarker = L.circleMarker(coordinates, {
              radius: 8,
              fillColor: "#2265d6",
              color: "#ffffff",
              weight: 3,
              fillOpacity: 1,
            })
              .addTo(this.map!)
              .bindTooltip("Your location");
            this.map?.setView(coordinates, 17);
            this.notify(
              "Showing your location. Use Reset view to return to campus.",
            );
          }
        }),
      () =>
        this.zone.run(() =>
          this.locationFailure(
            "Location could not be found. Allow location access or choose a starting building.",
          ),
        ),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
    );
  }
  private locationFailure(message: string) {
    this.locating.set(false);
    this.routeError.set(message);
    this.notify(message);
  }
  openDetails(place: Building) {
    this.selectedBuilding.set(place);
    this.dialogType.set("details");
    this.showDialog();
  }
  openDirections(place: Building) {
    this.selectedBuilding.set(place);
    this.dialogType.set("directions");
    this.routeError.set("");
    this.origin.set("");
    this.showDialog();
    queueMicrotask(() =>
      this.placeDialog.nativeElement
        .querySelector<HTMLSelectElement>("#origin")
        ?.focus(),
    );
  }
  private showDialog() {
    if (!this.placeDialog.nativeElement.open)
      this.placeDialog.nativeElement.showModal();
  }
  closeDialog() {
    this.placeDialog.nativeElement.close();
  }
  onBackdrop(event: MouseEvent) {
    if (event.target === this.placeDialog.nativeElement) this.closeDialog();
  }
  changeOrigin(value: string) {
    this.origin.set(value);
    this.routeError.set("");
    if (value === "location" && !this.userLocation()) this.locate(true);
  }
  routeIsValid() {
    return (
      this.origin() !== String(this.selectedBuilding()?.id) &&
      (this.origin() !== "location" || !!this.userLocation())
    );
  }
  togglePreference(key: keyof Preferences) {
    this.preferences.update((p) => ({ ...p, [key]: !p[key] }));
    if (
      !this.writeStorage(
        "campusable-preferences",
        JSON.stringify(this.preferences()),
      )
    )
      this.notify(
        "Preference applied for this visit. Browser storage is unavailable.",
      );
  }
  resetPreferences() {
    this.preferences.set({
      contrast: false,
      largeText: false,
      reduceMotion: false,
    });
    this.writeStorage(
      "campusable-preferences",
      JSON.stringify(this.preferences()),
    );
  }
  private reducedMotion() {
    return (
      this.preferences().reduceMotion ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }
  private readStorage(key: string) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }
  private writeStorage(key: string, value: string) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  }
  private loadPreferences(): Preferences {
    try {
      const data = JSON.parse(
        this.readStorage("campusable-preferences") || "{}",
      );
      return {
        contrast: data?.contrast === true,
        largeText: data?.largeText === true,
        reduceMotion: data?.reduceMotion === true,
      };
    } catch {
      return { contrast: false, largeText: false, reduceMotion: false };
    }
  }
  notify(message: string) {
    clearTimeout(this.toastTimeout);
    this.toast.set(message);
    this.toastTimeout = setTimeout(() => this.toast.set(""), 5500);
  }
}
