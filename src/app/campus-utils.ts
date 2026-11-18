import type { Building, CampusId, Category } from "./campus-data";

export function filterBuildings(
  buildings: Building[],
  campusId: CampusId,
  query: string,
  category: Category,
  savedIds?: number[],
): Building[] {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return buildings.filter(
    (place) =>
      place.campusId === campusId &&
      (category === "All places" || place.category === category) &&
      (!savedIds || savedIds.includes(place.id)) &&
      words.every((word) =>
        `${place.name} ${place.code} ${place.category} ${place.tags.join(" ")} ${place.features}`
          .toLowerCase()
          .includes(word),
      ),
  );
}

export function readSavedIds(
  value: string | null,
  buildings: Building[],
): number[] {
  try {
    const data: unknown = JSON.parse(value || "[]");
    return Array.isArray(data)
      ? [
          ...new Set(
            data.filter(
              (id): id is number =>
                typeof id === "number" &&
                buildings.some((place) => place.id === id),
            ),
          ),
        ]
      : [];
  } catch {
    return [];
  }
}

export function directionsUrl(
  destination: Building,
  origin?: Building | [number, number],
): string {
  const params = new URLSearchParams({
    api: "1",
    destination:
      destination.name + " George Mason University " + destination.campusId,
    travelmode: "walking",
  });
  if (origin)
    params.set(
      "origin",
      Array.isArray(origin)
        ? origin.join(",")
        : origin.name + " George Mason University " + origin.campusId,
    );
  return `https://www.google.com/maps/dir/?${params}`;
}
