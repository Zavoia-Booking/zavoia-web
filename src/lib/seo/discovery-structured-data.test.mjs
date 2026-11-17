import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import ts from "typescript";

// Compile the real schema helpers and their dependencies, including locale and
// section-visibility rules, without requiring a running API or Next server.
const sourceRoot = fileURLToPath(new URL("../../", import.meta.url));
const modules = new Map();
const moduleProcess = { env: { ...process.env, NEXT_PUBLIC_SITE_URL: "https://www.zavoia.com" } };
function load(filename) {
  if (modules.has(filename)) return modules.get(filename);
  const exports = {};
  modules.set(filename, exports);
  const source = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const execute = vm.runInThisContext(`(function(exports, require, process) {${source}\n})`, { filename });
  execute(exports, specifier => specifier === "server-only" ? {} : load(`${specifier.startsWith("@/")
    ? resolve(sourceRoot, specifier.slice(2))
    : resolve(dirname(filename), specifier)}.ts`), moduleProcess);
  return exports;
}
const { homeStructuredData, discoveryStructuredData } = load(resolve(sourceRoot, "lib/seo/discovery-structured-data.ts"));
const { websiteStructuredData } = load(resolve(sourceRoot, "lib/seo/website-structured-data.ts"));
const { dictionaries } = load(resolve(sourceRoot, "i18n/dictionaries.ts"));
const ofType = (graph, type) => graph["@graph"].find(node => node["@type"] === type);
const merchant = graph => graph["@graph"].find(node => node["@id"] === "https://www.zavoia.com/#business-12");
const page = graph => graph["@graph"].find(node => node["@id"].endsWith("#webpage"));
const section = (type, visible = true, config, variant = "default") => ({ type, visible, config, variant });
const website = () => ({
  businessId: 12, slug: "atelier",
  identity: {
    name: "Atelier", logo: "/images/atelier.png", email: "hello@example.invalid",
    instagramUrl: "instagram.com/atelier", facebookUrl: null, tiktokUrl: null,
    pinterestUrl: null, websiteUrl: "https://atelier.example.invalid/",
  },
  website: {
    pageLayout: [section("hero"), section("about"), section("faq")],
    aboutContent: "A real title\n\nA real story.",
    faq: [{ q: { en: "Where?", ro: "Unde?" }, a: { en: "Here.", ro: "Aici." } }],
  },
});

test("home locales describe separate pages on the same verified website", () => {
  for (const [locale, path] of [["en", "/"], ["ro", "/ro"]]) {
    const graph = homeStructuredData(locale);
    assert.equal(page(graph)["@id"], `https://www.zavoia.com${path}#webpage`);
    assert.equal(page(graph).url, `https://www.zavoia.com${path}`);
    assert.equal(page(graph).name, dictionaries[locale].home.title);
    assert.equal(page(graph).description, dictionaries[locale].home.description);
    assert.equal(page(graph).inLanguage, locale);
    assert.equal(page(graph).isPartOf["@id"], ofType(graph, "WebSite")["@id"]);
    assert.equal(page(graph).publisher["@id"], ofType(graph, "Organization")["@id"]);
  }
});

test("collection graphs connect the visible trail and displayed result slice", () => {
  const graph = discoveryStructuredData({
    locale: "ro", path: "/ro/bucuresti/coafor", name: "Coafor în București", description: "Results.",
    breadcrumbs: [{ name: "Acasă", path: "/ro" }, { name: "Categorii", path: "/ro/industries" }, { name: "Coafor" }],
    items: [{ name: "A branch", path: "/ro/business/a" }, { name: "B branch", path: "/ro/business/b" }],
  });
  const list = ofType(graph, "ItemList");
  const trail = ofType(graph, "BreadcrumbList");
  assert.equal(page(graph)["@type"], "CollectionPage");
  assert.equal(page(graph)["@id"], "https://www.zavoia.com/ro/bucuresti/coafor#webpage");
  assert.deepEqual(page(graph).mainEntity, { "@id": list["@id"] });
  assert.deepEqual(page(graph).breadcrumb, { "@id": trail["@id"] });
  assert.equal(page(graph).isPartOf["@id"], ofType(graph, "WebSite")["@id"]);
  assert.equal(list.numberOfItems, 2);
  assert.deepEqual(list.itemListElement.map(item => [item.position, item.name, item.item]), [
    [1, "A branch", "https://www.zavoia.com/ro/business/a"],
    [2, "B branch", "https://www.zavoia.com/ro/business/b"],
  ]);
  assert.deepEqual(trail.itemListElement.map(item => item.item), [
    "https://www.zavoia.com/ro", "https://www.zavoia.com/ro/industries", "https://www.zavoia.com/ro/bucuresti/coafor",
  ]);
});

test("empty collections retain page identity and never invent results or a single-item trail", () => {
  const graph = discoveryStructuredData({ locale: "en", path: "/industries", name: "Categories", description: "Directory.", breadcrumbs: [{ name: "Categories" }], items: [] });
  assert.equal(ofType(graph, "ItemList"), undefined);
  assert.equal(ofType(graph, "BreadcrumbList"), undefined);
  assert.equal(page(graph).mainEntity, undefined);
  assert.equal(page(graph).breadcrumb, undefined);
});

test("directory choices preserve the actual localized search destinations and order", () => {
  const graph = discoveryStructuredData({
    locale: "ro", path: "/ro/industries", name: "Categorii", description: "Directory.", breadcrumbs: [],
    items: [{ name: "Coafor", path: "/ro/search?industry=hair-salon" }, { name: "Altele", path: "/ro/search?industry=other" }],
  });
  assert.deepEqual(ofType(graph, "ItemList").itemListElement.map(item => item.item), [
    "https://www.zavoia.com/ro/search?industry=hair-salon", "https://www.zavoia.com/ro/search?industry=other",
  ]);
});

test("a merchant publishes its hosted website and shares its marketplace identity", () => {
  const site = website();
  const graph = websiteStructuredData(site, "ro", "/ro/atelier");
  assert.deepEqual(page(graph).publisher, { "@id": merchant(graph)["@id"] });
  assert.equal(merchant(graph).url, "https://www.zavoia.com/atelier");
  assert.equal(merchant(graph).description, "A real title\n\nA real story.");
  assert.equal(merchant(graph).logo, "https://www.zavoia.com/images/atelier.png");
  assert.deepEqual(merchant(graph).sameAs, ["https://instagram.com/atelier", "https://atelier.example.invalid/"]);
  assert.equal(merchant(graph).email, "hello@example.invalid");
  assert.equal(page(graph).mainEntity[0].name, "Unde?");
  assert.equal(page(graph).mainEntity[0].acceptedAnswer.text, "Aici.");
});

test("website copy, FAQ and footer fields follow published section visibility", () => {
  const site = website();
  site.website.pageLayout = [section("hero"), section("about", false), section("faq", false), section("footer", false), section("nav", false)];
  const graph = websiteStructuredData(site, "en", "/atelier");
  for (const field of ["description", "logo", "email", "sameAs"]) assert.equal(merchant(graph)[field], undefined, field);
  assert.equal(page(graph)["@type"], "WebPage");
  assert.deepEqual(page(graph).mainEntity, { "@id": merchant(graph)["@id"] });
  site.website.pageLayout = [];
  const empty = websiteStructuredData(site, "en", "/atelier");
  for (const field of ["logo", "email", "sameAs"]) assert.equal(merchant(empty)[field], undefined, field);
});

test("only the navigation or a visible Directory footer exposes the logo image", () => {
  const site = website();
  for (const variant of ["editorial", "signature", "masthead", "marque"]) {
    site.website.pageLayout = [section("hero"), section("nav", false), section("footer", true, {}, variant)];
    assert.equal(merchant(websiteStructuredData(site, "en", "/atelier")).logo, undefined, variant);
  }
  site.website.pageLayout = [section("hero"), section("nav", false), section("footer", true, { showLogo: false })];
  assert.equal(merchant(websiteStructuredData(site, "en", "/atelier")).logo, undefined);
  site.website.pageLayout = [section("hero"), section("nav", false), section("footer", true, {}, "retired-footer")];
  assert.equal(merchant(websiteStructuredData(site, "en", "/atelier")).logo, "https://www.zavoia.com/images/atelier.png");
});

test("merchant website links follow the selected footer's actual contacts", () => {
  const site = website();
  for (const variant of ["directory", "editorial", "signature", "masthead", "marque", "retired-footer"]) {
    site.website.pageLayout = [section("hero"), section("footer", true, {}, variant)];
    const expected = variant === "marque"
      ? ["https://instagram.com/atelier"]
      : ["https://instagram.com/atelier", "https://atelier.example.invalid/"];
    assert.deepEqual(merchant(websiteStructuredData(site, "en", "/atelier")).sameAs, expected, variant);
  }
});

test("websites reject unsafe identity URLs and omit hidden headlines and incomplete answers", () => {
  const site = website();
  site.identity.logo = "javascript:alert(1)";
  site.identity.websiteUrl = "https://user:password@atelier.example.invalid/";
  site.website.pageLayout = [section("about", true, { headlineHidden: true }), section("faq")];
  site.website.faq = [
    { q: { en: "English question", ro: "" }, a: { en: "English answer", ro: "" } },
    { q: { en: "Incomplete", ro: "" }, a: { en: "", ro: "" } },
  ];
  const graph = websiteStructuredData(site, "ro", "/ro/atelier");
  assert.equal(merchant(graph).description, "A real story.");
  assert.equal(merchant(graph).logo, undefined);
  assert.deepEqual(merchant(graph).sameAs, ["https://instagram.com/atelier"]);
  assert.equal(page(graph).mainEntity.length, 1);
  assert.equal(page(graph).mainEntity[0].name, "English question");
  assert.equal(page(graph).mainEntity[0].acceptedAnswer.text, "English answer");
});
