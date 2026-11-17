import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import ts from "typescript";
import { contextFixture, profileFixture } from "../../../e2e/professionals/fixtures.mjs";

const sourceRoot = fileURLToPath(new URL("../../", import.meta.url));
const modules = new Map();
function load(filename) {
  if (modules.has(filename)) return modules.get(filename);
  const exports = {};
  modules.set(filename, exports);
  const source = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInThisContext(`(function(exports, require) {${source}\n})`, { filename })(exports,
    specifier => specifier === "server-only" ? {} : load(`${specifier.startsWith("@/") ? resolve(sourceRoot, specifier.slice(2)) : resolve(dirname(filename), specifier)}.ts`));
  return exports;
}

const { brandStructuredData, professionalStructuredData } = load(resolve(sourceRoot, "lib/seo/page-structured-data.ts"));
const { SITE_URL } = load(resolve(sourceRoot, "lib/site.ts"));
const graphNode = (data, type) => data["@graph"].find(node => node["@type"] === type);
const merchant = data => data["@graph"].find(node => node["@id"] === `${SITE_URL}/#business-101`);
const brandFixture = () => ({
  businessId: 101, slug: "the-brand", name: "The Brand", description: "Our visible introduction.",
  logo: "/brand/logo.png", locationsCount: 7,
  locations: [
    { id: 201, slug: "old-town", name: "Old Town" },
    { id: 202, slug: null, name: "North" },
  ],
});

test("brand collection describes the displayed branch pages without inventing duplicate venues", () => {
  const brand = brandFixture();
  const en = brandStructuredData(brand, "en", "/brand/the-brand");
  const ro = brandStructuredData(brand, "ro", "/ro/brand/the-brand");
  for (const [graph, prefix] of [[en, ""], [ro, "/ro"]]) {
    const page = graphNode(graph, "CollectionPage");
    const list = graphNode(graph, "ItemList");
    assert.deepEqual(page.about, { "@id": merchant(graph)["@id"] });
    assert.deepEqual(page.mainEntity, { "@id": list["@id"] });
    assert.equal(page.description, brand.description);
    assert.equal(list.numberOfItems, 2, "Unshown backend totals do not inflate the described list");
    assert.deepEqual(list.itemListElement.map(item => [item.position, item.name, item.item]), [
      [1, "Old Town", `${SITE_URL}${prefix}/business/old-town`],
      [2, "North", `${SITE_URL}${prefix}/business/202`],
    ]);
    assert.equal(graphNode(graph, "LocalBusiness"), undefined, "Location UUIDs are absent from the brand projection");
    assert.equal(merchant(graph).aggregateRating, undefined, "The brand aggregate mixes review subjects");
    assert.equal(merchant(graph).url, `${SITE_URL}/brand/the-brand`);
  }
  assert.equal(merchant(en)["@id"], merchant(ro)["@id"]);
});

test("a brand without displayed locations retains its factual organization profile", () => {
  const brand = { ...brandFixture(), locations: [] };
  const graph = brandStructuredData(brand, "en", "/brand/the-brand");
  assert.equal(graphNode(graph, "ItemList"), undefined);
  assert.equal(graphNode(graph, "CollectionPage"), undefined);
  assert.deepEqual(graphNode(graph, "WebPage").mainEntity, { "@id": merchant(graph)["@id"] });
  assert.equal(brandStructuredData({ ...brand, name: " " }, "en", "/brand/the-brand"), null);
});

test("professional pages identify one real person across locales with reciprocal page references", () => {
  const profile = profileFixture();
  const business = contextFixture().businesses[0];
  const en = professionalStructuredData(profile, "en", [business, business, { ...business, id: 102, name: " " }]);
  const ro = professionalStructuredData(profile, "ro", []);
  const person = graphNode(en, "Person");
  const roPerson = graphNode(ro, "Person");
  const page = graphNode(en, "ProfilePage");
  assert.equal(person["@id"], roPerson["@id"]);
  assert.deepEqual(page.mainEntity, { "@id": person["@id"] });
  assert.deepEqual(person.mainEntityOfPage, { "@id": page["@id"] });
  assert.equal(page.description, profile.about.aboutMe);
  assert.equal(person.worksFor.length, 1);
  assert.equal(person.worksFor[0]["@id"], `${SITE_URL}/#business-101`);
  assert.equal(roPerson.worksFor, undefined, "A failed/empty booking context makes no employer claim");
  assert.equal(person.aggregateRating, undefined, "Person is not a Google review-snippet type");
  assert.equal(page.dateCreated, undefined, "An account join date does not prove the profile creation date");
  assert.notEqual(person.url, graphNode(ro, "ProfilePage").url);
  assert.equal(roPerson.mainEntityOfPage["@id"], graphNode(ro, "ProfilePage")["@id"]);
});

test("professional schema omits unnamed placeholder identities and invalid social/image URLs", () => {
  const profile = profileFixture();
  profile.about.socialLinks = {
    instagram: "www.instagram.com/mara/", facebook: "https://www.facebook.com/mara/",
    website: "https://user:secret@example.com/", tiktok: "javascript:alert(1)",
  };
  profile.profileImage = "data:image/png;base64,abc";
  const person = graphNode(professionalStructuredData(profile, "en", []), "Person");
  assert.deepEqual(person.sameAs, ["https://www.instagram.com/mara/", "https://www.facebook.com/mara/"]);
  assert.equal(person.image, undefined);
  profile.firstName = profile.lastName = null;
  profile.about.displayName = " ";
  assert.equal(professionalStructuredData(profile, "en", []), null);
});
