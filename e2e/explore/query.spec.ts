import { expect, test } from "@playwright/test";
import { deriveSearchParams, hasLocationRefinements, patchSearchParams, searchRequestKey, toSearchListingsParams } from "@/lib/search/query";
import { EMPTY_FILTERS } from "@/lib/search/filters";

test("a city-only search never inherits radius coordinates", () => {
  const query = deriveSearchParams(new URLSearchParams("city=Paris&radius=50"));
  expect(query.city).toBe("Paris");
  expect(query.lat).toBeUndefined();
  expect(query.lng).toBeUndefined();
  expect(query.radius).toBeUndefined();
});

test("area-search radius survives parsing and changes the fetch key", () => {
  const params = new URLSearchParams("lat=48.85&lng=2.35&radius=42&mapZoom=10.5");
  const area = deriveSearchParams(params);
  expect(area.radius).toBe(42);
  expect(area.mapZoom).toBe(10.5);
  params.delete("radius");
  expect(deriveSearchParams(params).radius).toBe(20);
  expect(searchRequestKey(area)).not.toBe(searchRequestKey(deriveSearchParams(params)));
});

test("a point's display label never restricts the API radius to city boundaries", () => {
  const query = deriveSearchParams(new URLSearchParams("city=Paris&lat=48.85&lng=2.35&radius=42&mapZoom=10.5"));
  const request = toSearchListingsParams(query);
  expect(query.city).toBe("Paris");
  expect(request.city).toBeUndefined();
  expect([request.lat, request.lng, request.radius]).toEqual([48.85, 2.35, 42]);
  expect(request.strict).toBe(true);
  expect(request).not.toHaveProperty("mapZoom");
  expect(toSearchListingsParams(deriveSearchParams(new URLSearchParams("city=Paris"))).city).toBe("Paris");
});

test("invalid or partial points never create a half-geographic request", () => {
  for (const raw of ["lat=91&lng=2", "lat=44&lng=181", "lat=44", "lng=26", "lat=NaN&lng=26"]) {
    const query = deriveSearchParams(new URLSearchParams(raw));
    expect([query.lat, query.lng, query.radius]).toEqual([undefined, undefined, undefined]);
  }
  expect(deriveSearchParams(new URLSearchParams("lat=0&lng=0&radius=999")).radius).toBe(50);
});

test("All or another industry clears the old service tags", () => {
  const current = new URLSearchParams("city=Bucharest&industry=home-services&tagIds=63&offset=100");
  const all = patchSearchParams(current, { industry: null });
  expect(all.has("industry")).toBe(false);
  expect(all.has("tagIds")).toBe(false);
  expect(all.has("offset")).toBe(false);
  expect(all.get("city")).toBe("Bucharest");
  expect(patchSearchParams(current, { industry: "automotive" }).has("tagIds")).toBe(false);
  expect(current.get("tagIds")).toBe("63");
});

test("an explicit new service choice is preserved and tag ids are normalized", () => {
  const next = patchSearchParams(new URLSearchParams("tagIds=63"), { industry: "automotive", tagIds: "12,12,-1,bad,13" });
  expect(deriveSearchParams(next).tagIds).toEqual([12, 13]);
});

test("business summaries are excluded by location refinements, not sort alone", () => {
  expect(hasLocationRefinements(EMPTY_FILTERS)).toBe(false);
  expect(hasLocationRefinements({ ...EMPTY_FILTERS, sort: "rating" })).toBe(false);
  expect(hasLocationRefinements({ ...EMPTY_FILTERS, openNow: true })).toBe(true);
  expect(hasLocationRefinements({ ...EMPTY_FILTERS, maxDistanceKm: 5 })).toBe(true);
  expect(hasLocationRefinements({ ...EMPTY_FILTERS, minRating: 4.8 })).toBe(true);
  expect(hasLocationRefinements({ ...EMPTY_FILTERS, languageTagIds: [1] })).toBe(true);
});
