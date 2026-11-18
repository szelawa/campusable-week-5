import { Component, input } from "@angular/core";

const paths: Record<string, string> = {
  compass:
    "m16.3 7.7-2.8 5.8-5.8 2.8 2.8-5.8 5.8-2.8M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0",
  map: "m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6m6-3v15m6-12v15",
  bookmark: "M6 4h12v17l-6-4-6 4V4Z",
  access: "M12 3a1.5 1.5 0 1 0 0 .01M5 8l7 2 7-2m-7 2v5m0 0-4 6m4-6 4 6",
  book: "M12 5v16M3 4c4-1 6 0 9 2 3-2 5-3 9-2v15c-4-1-6 0-9 2-3-2-5-3-9-2V4Z",
  search: "M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0",
  chevron: "m9 5 7 7-7 7",
  down: "m6 9 6 6 6-6",
  arrow: "M4 12h16m-6-6 6 6-6 6",
  external: "M14 3h7v7m0-7L10 14m1-11H4v17h17v-7",
  pin: "M19 10c0 6-7 11-7 11S5 16 5 10a7 7 0 1 1 14 0Zm-5 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0",
  building: "M4 21V3h12v18M16 9h4v12M2 21h20M8 7h4m-4 4h4m-4 4h4m-3 6v-3h2v3",
  coffee:
    "M4 8h12v8a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V8Zm12 1h2a3 3 0 0 1 0 6h-2M7 2v3m5-3v3M2 22h18",
  route: "M6 6h10a4 4 0 0 1 0 8H8a4 4 0 0 0 0 8h10M6 3v6M3 6h6m9 13 3 3-3 3",
  directions: "m12 2 10 10-10 10L2 12 12-10Zm-4 13v-4h8m-3-3 3 3-3 3",
  sliders: "M4 21v-7m0-4V3m8 18V10m0-4V3m8 18v-3m0-4V3M1 10h6m2-4h6m2 8h6",
  check: "m5 12 4 4L19 6",
  close: "m6 6 12 12M6 18 18 6",
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  locate:
    "M12 2v3m0 14v3M2 12h3m14 0h3M18 12a6 6 0 1 1-12 0 6 6 0 0 1 12 0m-4 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0",
  layers: "m12 3 10 6-10 6L2 9l10-6ZM2 14l10 6 10-6M2 19l10 6 10-6",
  info: "M12 11v6m0-10v.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0",
  shield: "m12 2 8 4v6c0 5-8 10-8 10S4 17 4 12V6l8-4Zm-4 10 3 3 5-6",
  heart:
    "M20.8 4.6c-2.1-2.2-5.5-2.2-7.6 0L12 5.8l-1.2-1.2c-2.1-2.2-5.5-2.2-7.6 0s-2.1 5.6 0 7.8L12 21l8.8-8.6c2.1-2.2 2.1-5.6 0-7.8Z",
  list: "M9 6h12M9 12h12M9 18h12M3 6h.01M3 12h.01M3 18h.01",
  menu: "M3 6h18M3 12h18M3 18h18",
  mail: "M3 5h18v14H3V5Zm0 0 9 8 9-8",
  phone: "M7 3H3c0 10 8 18 18 18v-4l-5-2-2 2-7-7 2-2-2-5Z",
  sun: "M12 2v2m0 16v2M2 12h2m16 0h2M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
  text: "M4 5h16M12 5v16M8 21h8",
  motion: "M3 7h8M3 12h5M3 17h8M15 5l6 7-6 7",
  swap: "M7 3v17m-4-4 4 4 4-4M17 21V4m-4 4 4-4 4 4",
};

@Component({
  selector: "app-icon",
  standalone: true,
  template: `<svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.65"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path [attr.d]="path()" />
  </svg>`,
  styles: [
    ":host { display: inline-flex; width: 20px; height: 20px; flex-shrink: 0; } svg { width: 100%; height: 100%; }",
  ],
})
export class IconComponent {
  name = input("compass");
  path() {
    return paths[this.name()] ?? paths["compass"];
  }
}
