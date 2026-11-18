import test from "node:test";
import assert from "node:assert/strict";
import { BUILDINGS, CAMPUSES } from "../src/app/campus-data.ts";
import {
  filterBuildings,
  readSavedIds,
  directionsUrl,
} from "../src/app/campus-utils.ts";

test("each campus has places with unique IDs and valid coordinates", () => {
  assert.equal(new Set(BUILDINGS.map((p) => p.id)).size, BUILDINGS.length);
  for (const campus of CAMPUSES) {
    const places = BUILDINGS.filter((p) => p.campusId === campus.id);
    assert.ok(places.length >= 3);
    for (const place of places) {
      assert.ok(Math.abs(place.coordinates[0] - campus.center[0]) < 0.025);
      assert.ok(Math.abs(place.coordinates[1] - campus.center[1]) < 0.025);
      assert.ok(new URL(place.sourceUrl).hostname.endsWith("gmu.edu"));
    }
  }
});
test("search matches case-insensitive words, abbreviations, and features", () => {
  assert.equal(
    filterBuildings(BUILDINGS, "fairfax", "  fENWick  ", "All places")[0].name,
    "Fenwick Library",
  );
  assert.equal(
    filterBuildings(BUILDINGS, "fairfax", "JC", "All places")[0].id,
    2,
  );
  assert.equal(
    filterBuildings(BUILDINGS, "fairfax", "computer lab", "All places")[0].id,
    1,
  );
});
test("campus and category filters combine without leaking other campuses", () => {
  assert.deepEqual(
    filterBuildings(BUILDINGS, "fairfax", "", "Libraries").map((p) => p.id),
    [4],
  );
  assert.equal(
    filterBuildings(BUILDINGS, "arlington", "Fenwick", "All places").length,
    0,
  );
  assert.equal(
    filterBuildings(BUILDINGS, "fairfax", "Fenwick", "Academic").length,
    0,
  );
});
test("saved places respect active campus and an empty saved list", () => {
  assert.deepEqual(
    filterBuildings(BUILDINGS, "fairfax", "", "All places", [2, 5]).map(
      (p) => p.id,
    ),
    [2],
  );
  assert.deepEqual(
    filterBuildings(BUILDINGS, "arlington", "", "All places", [2, 5]).map(
      (p) => p.id,
    ),
    [5],
  );
  assert.deepEqual(
    filterBuildings(BUILDINGS, "fairfax", "", "All places", []),
    [],
  );
});
test("malformed saved data is safely discarded and IDs are validated", () => {
  for (const value of [null, "null", "{}", "broken"])
    assert.deepEqual(readSavedIds(value, BUILDINGS), []);
  assert.deepEqual(readSavedIds('[2,2,99,"4",null,4]', BUILDINGS), [2, 4]);
});
test("directions use the real destination and a selected building origin", () => {
  const url = new URL(directionsUrl(BUILDINGS[3], BUILDINGS[0]));
  assert.equal(url.origin, "https://www.google.com");
  assert.equal(url.searchParams.get("travelmode"), "walking");
  assert.match(url.searchParams.get("destination"), /Fenwick Library/);
  assert.match(url.searchParams.get("origin"), /Innovation Hall/);
});
test("directions support device coordinates or a start chosen in Google Maps", () => {
  assert.equal(
    new URL(directionsUrl(BUILDINGS[1], [38.83, -77.3])).searchParams.get(
      "origin",
    ),
    "38.83,-77.3",
  );
  assert.equal(
    new URL(directionsUrl(BUILDINGS[1])).searchParams.has("origin"),
    false,
  );
});
