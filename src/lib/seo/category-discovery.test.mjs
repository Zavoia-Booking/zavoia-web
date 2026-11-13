import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import ts from "typescript";

// The same loader as structured-data.test.mjs: compile the real modules.
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
const { getCategoryDiscoveryGroups, MIN_LISTINGS_TO_INDEX } = load(fileURLToPath(new URL("./category-discovery.ts", import.meta.url)));
const { slugifyRo } = load(fileURLToPath(new URL("../../data/seo.ts", import.meta.url)));

const industries = [{
  id: 1, slug: "hair-salon", name: "Hair Salon", nameRo: "Salon de coafură",
  tags: [{ id: 10, slug: "balayage", name: "Balayage", nameRo: "Balayage" }],
}];
const at = (city, tagIds = []) => ({ slug: `${city}-${tagIds.join("-")}`, category: { city, industryId: 1, tagIds } });
const entries = (locations) => getCategoryDiscoveryGroups(locations, industries, "en")
  .map((group) => `${group.id}: ${group.entries.map((entry) => entry.id).join(", ")}`);

test("a city × category page is offered from two listings, not one", () => {
  assert.equal(MIN_LISTINGS_TO_INDEX, 2);
  assert.deepEqual(entries([at("București", [10])]), [], "One listing repeats that business's own page");
  // Both list the industry; only one lists the service.
  assert.deepEqual(entries([at("București", [10]), at("Bucharest")]), ["bucharest: hair-salon"]);
  assert.deepEqual(entries([at("București", [10]), at("bucuresti", [10])]), ["bucharest: hair-salon, balayage"]);
});

test("a location counts once per category, and cities do not add up", () => {
  assert.deepEqual(entries([at("București", [10, 10]), at("București")]), ["bucharest: hair-salon"]);
  assert.deepEqual(entries([at("București"), at("Cluj-Napoca")]), []);
});

test("slugs keep Romanian output and fold other Latin letters instead of dropping them", () => {
  for (const [name, slug] of [
    ["București", "bucuresti"], ["Iași", "iasi"], ["Ştefan cel Mare", "stefan-cel-mare"], ["Salon de coafură", "salon-de-coafura"],
    ["Gießen", "giessen"], ["Łódź", "lodz"], ["Ærø", "aero"], ["Øresund", "oresund"], ["Đakovo", "dakovo"],
  ]) assert.equal(slugifyRo(name), slug, name);
});
