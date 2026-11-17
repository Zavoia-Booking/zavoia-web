import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import ts from "typescript";

// Compile the production helpers, including their actual localized URL rules.
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

const { blogPostStructuredData, blogBreadcrumbStructuredData } = load(resolve(sourceRoot, "lib/seo/page-structured-data.ts"));
const { getPostPublishedAt, getPostModifiedAt } = load(resolve(sourceRoot, "lib/blog/dates.ts"));
const { resolveBlogAuthor } = load(resolve(sourceRoot, "lib/blog/author.ts"));
const { SITE_URL } = load(resolve(sourceRoot, "lib/site.ts"));
const post = {
  locale: "en", path: "/blog/a-guide", headline: "A guide",
  description: "The visible summary", datePublished: "2025-01-10T10:00:00+02:00",
  author: { name: "Carmen", url: "https://example.com/carmen" },
};
const article = (input = {}) => blogPostStructuredData({ ...post, ...input })["@graph"]
  .find(node => node["@type"] === "BlogPosting");

test("article schema connects each localized canonical page and its displayed category", () => {
  for (const [locale, path, articleSection] of [
    ["en", "/blog/a-guide", "Guides"], ["ro", "/ro/blog/un-ghid", "Ghiduri"],
  ]) {
    const breadcrumbs = blogBreadcrumbStructuredData([
      { name: "Journal", path: locale === "en" ? "/blog" : "/ro/blog" },
      { name: post.headline, path },
    ]);
    const graph = blogPostStructuredData({ ...post, locale, path, articleSection, breadcrumbs })["@graph"];
    const story = graph.find(node => node["@type"] === "BlogPosting");
    const page = graph.find(node => node["@id"] === `${SITE_URL}${path}#webpage`);
    assert.equal(story.url, `${SITE_URL}${path}`);
    assert.equal(story.inLanguage, locale);
    assert.equal(story.articleSection, articleSection);
    assert.equal(story.mainEntityOfPage["@id"], page["@id"]);
    assert.equal(page.mainEntity["@id"], story["@id"]);
    assert.equal(page.breadcrumb["@id"], breadcrumbs["@id"]);
    assert.deepEqual(breadcrumbs.itemListElement.map(item => item.position), [1, 2]);
  }
});

test("article publication and modification claims require elapsed, valid editorial dates", () => {
  assert.equal(article().datePublished, "2025-01-10T08:00:00.000Z");
  assert.equal(article({ dateModified: "2025-01-11T10:00:00+02:00" }).dateModified, "2025-01-11T08:00:00.000Z");
  for (const value of ["", "2025-01-11", "2025-02-29T10:00:00Z", "2025-13-01T10:00:00Z", "2999-01-01T00:00:00Z"]) {
    assert.equal(getPostPublishedAt({ publishedAt: value }), undefined, value);
    assert.equal(article({ datePublished: value }).datePublished, undefined, value);
    assert.equal(article({ dateModified: value }).dateModified, undefined, value);
  }
  assert.equal(getPostPublishedAt({ publishedAt: "2024-02-29T10:00:00Z" }), "2024-02-29T10:00:00.000Z");
  assert.equal(article({ dateModified: post.datePublished }).dateModified, undefined);
  assert.equal(article({ dateModified: "2025-01-09T10:00:00Z" }).dateModified, undefined);
  assert.equal(getPostModifiedAt({ publishedAt: "invalid", modifiedAt: "2025-01-11T10:00:00Z" }), undefined);
});

test("article author identity stays aligned with the visible byline without fabricated URLs", () => {
  assert.deepEqual(article({ author: resolveBlogAuthor() }).author, { "@type": "Person", name: "Carmen" });
  assert.deepEqual(article({ author: { name: " Carmen ", url: "https://example.com/carmen" } }).author, {
    "@type": "Person", name: "Carmen", url: "https://example.com/carmen",
  });
  for (const url of ["javascript:alert(1)", "https://user:secret@example.com/", "/missing-author-profile"]) {
    assert.equal(article({ author: { name: "Carmen", url } }).author.url, undefined, url);
  }
  assert.equal(article({ author: " " }).author, undefined);
});

test("article images use real web cover variants and omit unavailable or unsafe assets", () => {
  const image = "https://cdn.sanity.io/images/project/dataset/cover.jpg";
  assert.deepEqual(article({ image: [image, image, "javascript:alert(1)", "/brand/logo.png"] }).image, [image]);
  assert.equal(article().image, undefined);
  assert.equal(blogPostStructuredData({ ...post, headline: " " }), null);
});
