export type CampusId = "fairfax" | "arlington" | "manassas";
export type Category = "All places" | "Academic" | "Libraries" | "Student life";
export interface Campus {
  id: CampusId;
  name: string;
  label: string;
  location: string;
  address: string;
  center: [number, number];
  zoom: number;
}
export interface Building {
  id: number;
  name: string;
  description: string;
  features: string;
  sourceUrl: string;
  sourceLabel: string;
  mapUrl: string;
  embedUrl?: string;
  campusId: CampusId;
  category: Exclude<Category, "All places">;
  code: string;
  tags: string[];
  coordinates: [number, number];
}
export const CAMPUSES: Campus[] = [
  {
    id: "fairfax",
    name: "Fairfax",
    label: "Fairfax campus",
    location: "Fairfax, Virginia",
    address: "4400 University Drive, Fairfax, VA",
    center: [38.8302, -77.3075],
    zoom: 16,
  },
  {
    id: "arlington",
    name: "Arlington",
    label: "Mason Square",
    location: "Arlington, Virginia",
    address: "3351 Fairfax Drive, Arlington, VA",
    center: [38.885, -77.1012],
    zoom: 17,
  },
  {
    id: "manassas",
    name: "Manassas",
    label: "Science & Technology campus",
    location: "Manassas, Virginia",
    address: "10900 University Boulevard, Manassas, VA",
    center: [38.7567, -77.5226],
    zoom: 16,
  },
];
// Preserve the four building descriptions and source links from the original app.
const originalBuildings = [
  {
    id: 1,
    name: "Innovation Hall",
    description:
      "An academic building with classrooms and spaces for group learning on the Fairfax campus.",
    features: "Teaching spaces and an ITS computer lab in Room 301.",
    sourceUrl:
      "https://its.gmu.edu/help-support/computer-labs-classrooms-information/",
    sourceLabel: "Mason ITS computer labs",
    mapUrl:
      "https://www.google.com/maps/search/?api=1&query=Innovation+Hall+George+Mason+University+Fairfax",
    embedUrl:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3108.173814132037!2d-77.30747079999999!3d38.82848!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89b64e60c9822067%3A0xd8ebbbeb00c2e454!2sInnovation%20Hall!5e0!3m2!1sen!2sus!4v1793335483243!5m2!1sen!2sus",
  },
  {
    id: 2,
    name: "Johnson Center (JC)",
    description:
      "A central place for students to eat, study, meet friends, and attend events between classes.",
    features: "Dining options, study rooms, lounges, and event spaces.",
    sourceUrl: "https://studentcenters.gmu.edu/the-johnson-center/",
    sourceLabel: "Mason Student Centers",
    mapUrl:
      "https://www.google.com/maps/search/?api=1&query=Johnson+Center+George+Mason+University+Fairfax",
    embedUrl:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3108.1147183463754!2d-77.30734079999999!3d38.82983349999999!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89b64f49a1a1542d%3A0xa6e4f7c1cc8c47f6!2sJohnson%20Center!5e0!3m2!1sen!2sus!4v1793335526875!5m2!1sen!2sus",
  },
  {
    id: 3,
    name: "Horizon Hall",
    description:
      "An academic building with active learning classrooms designed for discussion and group work.",
    features:
      "Classrooms with flexible learning spaces and technology for collaborative activities.",
    sourceUrl:
      "https://learningenvironments.gmu.edu/signature-learning-spaces/",
    sourceLabel: "Mason Learning Environments",
    mapUrl:
      "https://www.google.com/maps/search/?api=1&query=Horizon+Hall+George+Mason+University+Fairfax",
    embedUrl:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3108.0524159314573!2d-77.3076116!3d38.8312604!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89b64f94d152886d%3A0x926da2556950cf3a!2sHorizon%20Hall!5e0!3m2!1sen!2sus!4v1793335565904!5m2!1sen!2sus",
  },
  {
    id: 4,
    name: "Fenwick Library",
    description:
      "George Mason’s main research library, with study spaces, library collections, and research support.",
    features:
      "Group study rooms, the Research Commons, and the Special Collections Research Center.",
    sourceUrl: "https://library.gmu.edu/locations/fenwick",
    sourceLabel: "Mason University Libraries",
    mapUrl:
      "https://www.google.com/maps/search/?api=1&query=Fenwick+Library+George+Mason+University+Fairfax",
    embedUrl:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3108.0147296539417!2d-77.30714379999999!3d38.8321235!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89b64e5de5e701f3%3A0x7bbc5c6b065f984a!2sFenwick%20Library!5e0!3m2!1sen!2sus!4v1793335605049!5m2!1sen!2sus",
  },
];
const fairfaxDetails: Pick<
  Building,
  "category" | "code" | "tags" | "coordinates"
>[] = [
  {
    category: "Academic",
    code: "IN",
    tags: ["Classrooms", "Computer lab"],
    coordinates: [38.8284513, -77.3075094],
  },
  {
    category: "Student life",
    code: "JC",
    tags: ["Dining", "Study spaces"],
    coordinates: [38.8299673, -77.3074177],
  },
  {
    category: "Academic",
    code: "HZ",
    tags: ["Classrooms", "Collaborative learning"],
    coordinates: [38.8315515, -77.3078535],
  },
  {
    category: "Libraries",
    code: "FL",
    tags: ["Study spaces", "Research support"],
    coordinates: [38.8318625, -77.3069569],
  },
];
export const BUILDINGS: Building[] = originalBuildings.map(
  (building, index) => ({
    ...building,
    campusId: "fairfax",
    ...fairfaxDetails[index],
  }),
);
const additionalPlaces: Omit<Building, "mapUrl">[] = [
  {
    id: 5,
    campusId: "arlington",
    name: "Van Metre Hall",
    code: "VM",
    category: "Academic",
    coordinates: [38.8850621, -77.1011351],
    tags: ["Learning spaces", "Campus information"],
    description:
      "An academic and gathering place at Mason Square, with campus information in the first-floor lobby.",
    features: "Learning spaces and a campus information kiosk.",
    sourceUrl: "https://masonsquare.gmu.edu/about/contact",
    sourceLabel: "Mason Square",
  },
  {
    id: 6,
    campusId: "arlington",
    name: "Hazel Hall",
    code: "HH",
    category: "Academic",
    coordinates: [38.8851854, -77.1003636],
    tags: ["Academic building", "Mason Square"],
    description:
      "An academic building on the Mason Square campus in Arlington.",
    features: "See the official campus directory for building information.",
    sourceUrl: "https://registrar.gmu.edu/topics/building-codes/",
    sourceLabel: "Mason building directory",
  },
  {
    id: 7,
    campusId: "arlington",
    name: "Fuse at Mason Square",
    code: "FU",
    category: "Academic",
    coordinates: [38.8849202, -77.1017346],
    tags: ["Innovation", "Mason Square"],
    description: "A Mason Square building at 3401 Fairfax Drive.",
    features:
      "Explore the official Mason Square website for current programs and building details.",
    sourceUrl: "https://masonsquare.gmu.edu/",
    sourceLabel: "Mason Square",
  },
  {
    id: 8,
    campusId: "manassas",
    name: "Colgan Hall",
    code: "CH",
    category: "Student life",
    coordinates: [38.7565206, -77.5214867],
    tags: ["Campus information", "Library"],
    description:
      "A campus hub with an information kiosk in the first-floor lobby and Mercer Library.",
    features: "Campus information, Mercer Library, and Randall’s Café.",
    sourceUrl: "https://scitechcampus.gmu.edu/about/frequently-asked-questions",
    sourceLabel: "SciTech campus guide",
  },
  {
    id: 9,
    campusId: "manassas",
    name: "Katherine G. Johnson Hall",
    code: "KJ",
    category: "Academic",
    coordinates: [38.7572807, -77.5208814],
    tags: ["Computer lab", "Study spaces"],
    description:
      "An academic building at the Science and Technology campus with learning and student support spaces.",
    features:
      "A computer lab, printing services, and The Source study space. Check the campus guide for availability.",
    sourceUrl: "https://scitechcampus.gmu.edu/about/frequently-asked-questions",
    sourceLabel: "SciTech campus guide",
  },
  {
    id: 10,
    campusId: "manassas",
    name: "Hylton Performing Arts Center",
    code: "HP",
    category: "Student life",
    coordinates: [38.7593435, -77.5245195],
    tags: ["Arts & events", "Performance spaces"],
    description:
      "A performing arts destination on the Science and Technology campus.",
    features:
      "Performance and event spaces. Check the venue for event-specific access arrangements.",
    sourceUrl: "https://scitechcampus.gmu.edu/about/campus-buildings",
    sourceLabel: "SciTech campus buildings",
  },
];
BUILDINGS.push(
  ...additionalPlaces.map((place) => ({
    ...place,
    mapUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name + " George Mason University " + (place.campusId === "arlington" ? "Arlington" : "Manassas"))}`,
  })),
);
