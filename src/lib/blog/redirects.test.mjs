import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import ts from "typescript";

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
    specifier => load(`${specifier.startsWith("@/") ? resolve(sourceRoot, specifier.slice(2)) : resolve(dirname(filename), specifier)}.ts`));
  return exports;
}
const { blogRedirect } = load(resolve(sourceRoot, "lib/blog/redirects.ts"));
const { blogIndexHref, paginateBlogPosts } = load(resolve(sourceRoot, "lib/blog/listing.ts"));
const { isReservedBlogSlug } = load(resolve(sourceRoot, "lib/blog/category-routes.ts"));
const redirect = address => {
  const url = new URL(address, "https://www.zavoia.com");
  return blogRedirect(url.pathname, url.searchParams);
};

test("legacy categories keep their language, pagination and attribution in one redirect", () => {
  assert.equal(redirect("/blog?category=guides&page=2&utm_source=email"), "/blog/guides?page=2&utm_source=email");
  assert.equal(redirect("/ro/blog?category=business"), "/ro/blog/pentru-afaceri");
  assert.equal(redirect("/en/blog?category=product&page=1"), "/blog/product-news");
  assert.equal(redirect("/blog?category=all&page=2"), "/blog?page=2");
});

test("aliases and page-one variants normalize without looping canonical destinations", () => {
  assert.equal(redirect("/ro/blog/guides?page=2"), "/ro/blog/ghiduri?page=2");
  assert.equal(redirect("/blog/ghiduri?category=guides&page=1"), "/blog/guides");
  assert.equal(redirect("/en/blog/for-business"), "/blog/for-business");
  assert.equal(redirect("/blog?page=1"), "/blog");
  for (const address of ["/blog", "/blog/guides", "/ro/blog/ghiduri?page=2", "/blog/product-news?utm_source=email"]) {
    assert.equal(redirect(address), undefined, address);
  }
});

test("article paths, unrelated routes and malformed or contradictory filters stay with routing", () => {
  for (const address of [
    "/blog/a-real-post?category=guides", "/for-business", "/blog/missing/nested", "/es/blog?category=guides",
    "/blog?category=missing", "/blog?category=guides&category=business", "/blog?category=guides&page=0",
    "/blog?category=guides&page=2&page=3", "/blog/guides?category=product", "/blog/guides?page=1.5",
  ]) assert.equal(redirect(address), undefined, address);
});

test("category paths and article pagination preserve the existing featured-story sequence", () => {
  assert.equal(blogIndexHref("en", "business", 1), "/blog/for-business?page=2");
  assert.equal(blogIndexHref("ro", "product"), "/ro/blog/noutati-produs");
  const posts = Array.from({ length: 14 }, (_, id) => ({ id, category: "guides" }));
  const pages = [0, 1, 2].map(page => paginateBlogPosts(posts, "guides", page));
  assert.deepEqual([pages[0].featured.id, ...pages.flatMap(page => page.items.map(post => post.id))], posts.map(post => post.id));
  assert.equal(paginateBlogPosts(posts, "guides", 3), null);
  for (const slug of ["guides", "ghiduri", "for-business", "pentru-afaceri", "product-news", "noutati-produs"]) {
    assert.equal(isReservedBlogSlug(slug), true);
  }
  assert.equal(isReservedBlogSlug("a-guide-to-booking"), false);
});
