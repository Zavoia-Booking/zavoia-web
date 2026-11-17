import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import ts from "typescript";

// Compile real dictionaries, public prices, canonical URL rules and graph builders.
const sourceRoot = fileURLToPath(new URL("../../", import.meta.url));
const modules = new Map();
function load(filename) {
  if (modules.has(filename)) return modules.get(filename);
  const exports = {};
  modules.set(filename, exports);
  const source = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInThisContext(`(function(exports, require, process) {${source}\n})`, { filename })(exports,
    specifier => specifier === "server-only" ? {} : load(`${specifier.startsWith("@/") ? resolve(sourceRoot, specifier.slice(2)) : resolve(dirname(filename), specifier)}.ts`),
    { env: { ...process.env, NEXT_PUBLIC_SITE_URL: "https://www.zavoia.com" } });
  return exports;
}

const { marketingStructuredData } = load(resolve(sourceRoot, "lib/seo/marketing-structured-data.ts"));
const { marketingPageContent } = load(resolve(sourceRoot, "lib/marketing/page-content.ts"));
const { faqQuestions } = load(resolve(sourceRoot, "lib/seo/entities.ts"));
const { siteEntities, organizationId, websiteId } = load(resolve(sourceRoot, "lib/seo/site-identity.ts"));
const { serializeJsonLd } = load(resolve(sourceRoot, "lib/seo/json-ld.ts"));
const origin = "https://www.zavoia.com";

test("every marketing locale supplies the reported software property combination", () => {
  for (const locale of ["en", "ro"]) for (const page of ["for-business", "pricing", "web-studio"]) {
    const content = marketingPageContent(locale, page);
    const graph = marketingStructuredData(locale, page, content)["@graph"];
    const path = `${locale === "ro" ? "/ro" : ""}/${page}`;
    const webpage = graph.find(node => node["@id"] === `${origin}${path}#webpage`);
    const apps = graph.filter(node => ["SoftwareApplication", "WebApplication"].includes(node["@type"]));
    assert.equal(apps.length, 1, `${locale}/${page}: no redundant incomplete parent application`);
    const [app] = apps;
    assert.equal(app.applicationCategory, "BusinessApplication");
    assert.ok(app.operatingSystem);
    assert.ok(app.offers.length);
    assert.deepEqual(app.mainEntityOfPage, { "@id": webpage["@id"] });
    assert.deepEqual(webpage.about, { "@id": app["@id"] });
    assert.deepEqual(webpage.isPartOf, { "@id": websiteId });
    assert.equal(webpage.url, `${origin}${path}`);
    assert.equal(webpage.inLanguage, locale);
    assert.equal(webpage.name, content.name);
    assert.deepEqual(webpage.mainEntity, faqQuestions(content.faqItems));
    assert.equal(app.url, `${origin}/${page === "pricing" ? "for-business" : page}`);
    assert.doesNotMatch(JSON.stringify(graph), /"(?:review|aggregateRating|downloadUrl|installUrl|softwareVersion)":/);
    assert.deepEqual(app.operatingSystem, page === "web-studio" ? "Any" : ["Android", "iOS"]);
    if (page !== "web-studio") assert.match(app.softwareRequirements, /Web access/);
  }
});

test("software offers match the visible monthly bundles and extra seat charge", () => {
  for (const [locale, currency, prices, seat] of [["en", "EUR", [20, 38], 7], ["ro", "RON", [99, 189], 35]]) {
    for (const page of ["for-business", "pricing", "web-studio"]) {
      const graph = marketingStructuredData(locale, page, marketingPageContent(locale, page))["@graph"];
      const app = graph.find(node => ["SoftwareApplication", "WebApplication"].includes(node["@type"]));
      assert.deepEqual(app.offers.map(offer => offer.price), page === "web-studio" ? prices.slice(1) : prices);
      assert.deepEqual(app.offers.map(offer => offer.name), page === "web-studio" ? ["Plus"] : ["Base", "Plus"]);
      for (const offer of app.offers) {
        assert.equal(offer.priceCurrency, currency);
        assert.ok(offer.price > 0, "a temporary trial must not become a permanently free offer");
        assert.equal(offer.priceSpecification.price, offer.price);
        assert.equal(offer.priceSpecification.priceCurrency, currency);
        assert.deepEqual(offer.priceSpecification.referenceQuantity, { "@type": "QuantitativeValue", value: 1, unitCode: "MON" });
        assert.equal(offer.addOn.price, seat);
        assert.equal(offer.addOn.priceCurrency, currency);
        assert.equal(offer.seller["@id"], organizationId);
        assert.ok(offer.url.startsWith(`${origin}${locale === "ro" ? "/ro" : ""}/pricing#pricing-plan-`));
      }
    }
  }
});

test("publisher identity uses the confirmed address and a real eligible logo asset", () => {
  const [organization] = siteEntities();
  assert.equal(organization.address.postalCode, "060023");
  assert.equal(organization.address.addressCountry, "RO");
  assert.equal(organization.taxID, "48718430");
  assert.equal(organization.vatID, undefined);
  const companyInfo = readFileSync(resolve(sourceRoot, "data/legal/company-info.ts"), "utf8");
  assert.match(companyInfo, /postal code 060023/);
  assert.match(companyInfo, /cod poștal 060023/);
  const logo = readFileSync(resolve(sourceRoot, "../public", new URL(organization.logo).pathname.slice(1)));
  assert.equal(logo.subarray(1, 4).toString(), "PNG");
  assert.ok(logo.readUInt32BE(16) >= 112 && logo.readUInt32BE(20) >= 112);
});

test("JSON-LD serialization prevents merchant/editor text from ending the script", () => {
  const input = { text: '</script><script>alert("unsafe")</script><!--', separator: "\u2028\u2029", unicode: "București" };
  const serialized = serializeJsonLd(input);
  assert.ok(!serialized.includes("<"));
  assert.deepEqual(JSON.parse(serialized), input);
});
