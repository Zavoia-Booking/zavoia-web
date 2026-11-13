import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import ts from "typescript";
import { listingFixture } from "../../../e2e/professionals/fixtures.mjs";

// Compile the real dependency graph: the shared identity and hours parsers are
// exercised, rather than replaced by copies of their implementations.
const sourceRoot = fileURLToPath(new URL("../../", import.meta.url));
const modules = new Map();
function load(filename) {
  if (modules.has(filename)) return modules.get(filename);
  const exports = {};
  modules.set(filename, exports);
  const source = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const execute = vm.runInThisContext(`(function(exports, require) {${source}\n})`, { filename });
  execute(exports, specifier => load(`${specifier.startsWith("@/")
    ? resolve(sourceRoot, specifier.slice(2))
    : resolve(dirname(filename), specifier)}.ts`));
  return exports;
}
const { locationStructuredData, serializeLocationStructuredData } = load(fileURLToPath(new URL("./structured-data.ts", import.meta.url)));
const ofType = (graph, type) => graph["@graph"].find(node => node["@type"] === type);
const venue = graph => ofType(graph, "LocalBusiness");
const merchant = graph => graph["@graph"].find(node => node["@id"] === "https://zavoia.com/#business-101");

test("locale pages identify the same venue and publisher while preserving canonical page URLs", () => {
  const listing = listingFixture();
  const en = locationStructuredData(listing, "en");
  const ro = locationStructuredData(listing, "ro");
  assert.equal(venue(en)["@id"], venue(ro)["@id"]);
  assert.equal(venue(en).url, "https://zavoia.com/business/share-old-town");
  assert.equal(ofType(en, "WebPage").url, "https://zavoia.com/business/share-old-town");
  assert.equal(ofType(ro, "WebPage").url, "https://zavoia.com/ro/business/share-old-town");
  assert.equal(ofType(ro, "WebPage").inLanguage, "ro");
  assert.deepEqual(ofType(ro, "WebPage").mainEntity, { "@id": venue(ro)["@id"] });
  assert.deepEqual(ofType(ro, "WebPage").publisher, { "@id": "https://zavoia.com/#organization" });
  assert.deepEqual(ofType(ro, "WebPage").isPartOf, { "@id": "https://zavoia.com/#website" });
  assert.deepEqual(venue(ro).parentOrganization, { "@id": merchant(ro)["@id"] });
  assert.notEqual(merchant(ro)["@id"], ofType(ro, "WebPage").publisher["@id"]);
  listing.slug = listing.location.slug = "renamed-branch";
  assert.equal(venue(locationStructuredData(listing, "en"))["@id"], venue(en)["@id"]);
});

test("branch geography, description and contacts never inherit unrelated brand facts", () => {
  const listing = listingFixture();
  listing.country = "US";
  listing.description = "The merchant runs several branches.";
  listing.phone = "+12125550000";
  listing.email = "brand@example.invalid";
  listing.instagramUrl = "https://www.instagram.com/merchant/";
  listing.facebookUrl = "javascript:alert(1)";
  listing.websiteUrl = "/unpublished-relative-website";
  Object.assign(listing.location, {
    description: "  This particular branch.  ", phone: "+40215550000", email: "branch@example.invalid",
    addressComponents: { street: "Strada Centrului", streetNumber: "3", city: "Bucharest", country: "RO", postalCode: "030001" },
  });
  const graph = locationStructuredData(listing, "ro");
  assert.equal(venue(graph).description, "This particular branch.");
  assert.equal(venue(graph).telephone, "+40215550000");
  assert.equal(venue(graph).email, "branch@example.invalid");
  assert.deepEqual(venue(graph).address, {
    "@type": "PostalAddress", streetAddress: "3 Strada Centrului", addressLocality: "Bucharest", postalCode: "030001", addressCountry: "RO",
  });
  assert.equal(venue(graph).sameAs, undefined);
  assert.deepEqual(merchant(graph).sameAs, [listing.instagramUrl]);
  assert.equal(merchant(graph).description, listing.description);
  assert.equal(merchant(graph).telephone, undefined, "A separate unshown brand number is not emitted");
  listing.location.phone = null;
  listing.location.email = null;
  listing.location.description = null;
  listing.location.addressComponents = null;
  const fallback = locationStructuredData(listing, "en");
  assert.equal(venue(fallback).telephone, undefined);
  assert.equal(venue(fallback).email, undefined);
  assert.equal(venue(fallback).description, undefined);
  assert.equal(venue(fallback).address.addressCountry, undefined);
  assert.equal(merchant(fallback).telephone, listing.phone);
  assert.equal(merchant(fallback).email, listing.email);
});

test("published hours retain venue wall times, overnight start days and explicit closure", () => {
  const listing = listingFixture();
  listing.location.workingHours = {
    monday: { isOpen: true, open: " 9:00 ", close: "19:00" },
    tuesday: { isOpen: false, open: "bad", close: "bad" },
    wednesday: { isOpen: true, open: "09:00", close: "09:00" },
    thursday: { isOpen: true, open: "25:00", close: "19:00" },
    saturday: { isOpen: true, open: "22:00", close: "2:00" },
  };
  const hours = venue(locationStructuredData(listing, "en")).openingHoursSpecification;
  assert.deepEqual(hours, [
    { "@type": "OpeningHoursSpecification", dayOfWeek: "https://schema.org/Monday", opens: "09:00", closes: "19:00" },
    { "@type": "OpeningHoursSpecification", dayOfWeek: "https://schema.org/Tuesday", opens: "00:00", closes: "00:00" },
    { "@type": "OpeningHoursSpecification", dayOfWeek: "https://schema.org/Saturday", opens: "22:00", closes: "02:00" },
  ]);
  listing.timezone = listing.location.timezone = "America/New_York";
  assert.deepEqual(venue(locationStructuredData(listing, "ro")).openingHoursSpecification, hours);
});

test("only the explicit 24/7 flag produces all-day opening hours", () => {
  const listing = listingFixture();
  listing.location.workingHours = { monday: { isOpen: true, open: "00:00", close: "00:00" } };
  assert.equal(venue(locationStructuredData(listing, "en")).openingHoursSpecification, undefined);
  listing.location.open247 = true;
  const hours = venue(locationStructuredData(listing, "en")).openingHoursSpecification;
  assert.equal(hours.length, 1);
  assert.deepEqual(hours[0].dayOfWeek, ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => `https://schema.org/${day}`));
  assert.equal(hours[0].opens, "00:00");
  assert.equal(hours[0].closes, "23:59");
});

test("unknown data and mixed review aggregates do not become invented venue properties", () => {
  const listing = listingFixture();
  listing.country = "RO";
  listing.logo = "https://images.example.invalid/brand.png";
  listing.featuredImage = null;
  listing.portfolioImages = [];
  listing.industry = { id: 1, slug: "beauty", name: "Beauty" };
  listing.averageRating = 4.9;
  listing.totalReviews = 20;
  listing.additionalSettings = { showPricing: false };
  Object.assign(listing.location, { address: null, addressComponents: null, city: null, latitude: null, longitude: null });
  const node = venue(locationStructuredData(listing, "en"));
  for (const field of ["address", "geo", "description", "telephone", "email", "image", "openingHoursSpecification", "aggregateRating", "review", "offers", "priceRange", "currenciesAccepted"]) {
    assert.equal(node[field], undefined, `${field} stays absent`);
  }
  assert.equal(node["@type"], "LocalBusiness");
});

test("location photos are deduplicated public web URLs without borrowing brand artwork", () => {
  const listing = listingFixture();
  listing.featuredImage = " https://photos.example.invalid/venue.jpg ";
  listing.portfolioImages = [
    listing.featuredImage, { url: "/images/second.webp", caption: "Second photo" },
    "javascript:alert(1)", "data:image/png;base64,Zm9v", " ", "not a URL",
    "https://user:password@photos.example.invalid/private.jpg", "//external.example.invalid/image.jpg",
  ];
  const node = venue(locationStructuredData(listing, "en"));
  assert.deepEqual(node.image, ["https://photos.example.invalid/venue.jpg", "https://zavoia.com/images/second.webp"]);
});

test("coordinates require a complete finite pair and preserve valid zero values", () => {
  const listing = listingFixture();
  for (const [latitude, longitude] of [[null, 26], [44, null], [NaN, 26], [44, Infinity], [91, 26], [44, -181], ["44", 26]]) {
    Object.assign(listing.location, { latitude, longitude });
    assert.equal(venue(locationStructuredData(listing, "en")).geo, undefined);
  }
  Object.assign(listing.location, { latitude: 0, longitude: 0 });
  assert.deepEqual(venue(locationStructuredData(listing, "en")).geo, { "@type": "GeoCoordinates", latitude: 0, longitude: 0 });
});

test("merchant text cannot terminate the JSON-LD script and round-trips without loss", () => {
  const listing = listingFixture();
  listing.location.name = 'A </script><script>alert("x")</script> branch';
  listing.location.description = "Care < relaxation & quotes \"here\".";
  const serialized = serializeLocationStructuredData(listing, "ro");
  assert.equal(serialized.includes("<"), false);
  const parsed = JSON.parse(serialized);
  assert.equal(venue(parsed).name, `${listing.name} – ${listing.location.name}`);
  assert.equal(venue(parsed).description, listing.location.description);
  assert.deepEqual(parsed, locationStructuredData(listing, "ro"));
});

test("the venue is named as brand and branch, without repeating an identical name", () => {
  const listing = listingFixture();
  listing.name = "Atelier Nova";
  listing.location.name = "Băneasa";
  const graph = locationStructuredData(listing, "en", { ancestors: [{ name: "Hair salons in Bucharest", href: "/bucharest/hair-salon" }] });
  assert.equal(venue(graph).name, "Atelier Nova – Băneasa");
  assert.equal(ofType(graph, "BreadcrumbList").itemListElement.at(-1).name, "Băneasa", "The trail ends on the visible heading");
  listing.location.name = "  atelier   NOVA ";
  assert.equal(venue(locationStructuredData(listing, "en")).name, "Atelier Nova");
});

test("the address country is the ISO code for any country, however the business typed it", () => {
  const listing = listingFixture();
  const country = (value) => {
    listing.location.addressComponents = { city: "Somewhere", country: value };
    return venue(locationStructuredData(listing, "en")).address.addressCountry;
  };
  // English, Romanian or the country's own language; no country is built in.
  for (const [typed, code] of [
    ["Romania", "RO"], ["România", "RO"], ["ro", "RO"], ["Germany", "DE"], ["Germania", "DE"], ["Deutschland", "DE"],
    ["Magyarország", "HU"], ["Republica Moldova", "MD"], ["  united   kingdom ", "GB"], ["UK", "GB"], ["България", "BG"],
  ]) assert.equal(country(typed), code, typed);
  assert.equal(country("Atlantis"), "Atlantis", "A name that matches no country is kept as written");
});
