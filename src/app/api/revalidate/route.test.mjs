import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import ts from "typescript";
import { encodeSignatureHeader, SIGNATURE_HEADER_NAME } from "@sanity/webhook";
import { parseBody } from "next-sanity/webhook";

const require = createRequire(import.meta.url);
const { NextRequest, NextResponse } = require("next/server");
const secret = "unit-test-sanity-webhook-secret";
const filename = fileURLToPath(new URL("./route.ts", import.meta.url));
const source = ts.transpileModule(readFileSync(filename, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function handler(configuredSecret = secret) {
  const invalidations = [];
  const exports = {};
  const dependencies = {
    "next/cache": {
      revalidateTag: (...args) => invalidations.push({ tag: args }),
      revalidatePath: (...args) => invalidations.push({ path: args }),
    },
    "next/server": { NextResponse },
    // Exercise the installed parser and cryptographic signature verification.
    "next-sanity/webhook": { parseBody },
    "@/sanity/env": { revalidateSecret: configuredSecret },
  };
  vm.runInThisContext(`(function(exports, require) {${source}\n})`, { filename })(exports, specifier => {
    assert.ok(Object.hasOwn(dependencies, specifier), `Unexpected import: ${specifier}`);
    return dependencies[specifier];
  });
  return { post: exports.POST, invalidations };
}

async function request(payload, signingSecret = secret) {
  const body = typeof payload === "string" ? payload : JSON.stringify(payload);
  const signature = await encodeSignatureHeader(body, Date.now(), signingSecret);
  return new NextRequest("https://schema-test.example.invalid/api/revalidate", {
    method: "POST", body,
    headers: { [SIGNATURE_HEADER_NAME]: signature, "Content-Type": "application/json" },
  });
}

test("a signed post event expires both locale lookups and refreshes sitemap inventory", async () => {
  const { post, invalidations } = handler();
  const response = await post(await request({
    _type: "post", slug: { en: { current: "booking-guide" }, ro: { current: "ghid-programari" } },
  }));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { revalidated: true, type: "post" });
  assert.deepEqual(invalidations, [
    { tag: ["post", { expire: 0 }] },
    { tag: ["post:booking-guide", { expire: 0 }] },
    { tag: ["post:ghid-programari", { expire: 0 }] },
    { path: ["/sitemap.xml"] },
  ]);
});

test("a signed deletion without slug data still clears removed sitemap URLs", async () => {
  const { post, invalidations } = handler();
  assert.equal((await post(await request({ _type: "post" }))).status, 200);
  assert.deepEqual(invalidations, [{ tag: ["post", { expire: 0 }] }, { path: ["/sitemap.xml"] }]);
});

test("a signed non-post document event leaves article and sitemap caches alone", async () => {
  const { post, invalidations } = handler();
  const response = await post(await request({ _type: "sanity.imageAsset", slug: { en: { current: "unrelated" } } }));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { revalidated: false, type: "sanity.imageAsset" });
  assert.deepEqual(invalidations, []);
});

test("an invalid signature cannot invalidate article or sitemap caches", async () => {
  const { post, invalidations } = handler();
  const response = await post(await request({ _type: "post" }, "incorrect-signing-secret"));
  assert.equal(response.status, 401);
  assert.deepEqual(invalidations, []);
});

test("signed malformed JSON returns 400 and never reaches invalidation", async () => {
  const { post, invalidations } = handler();
  const response = await post(await request('{"_type":"post",'));
  assert.equal(response.status, 400);
  assert.deepEqual(invalidations, []);
});

test("an unconfigured webhook fails before inspecting or invalidating anything", async () => {
  // The explicit empty secret models a deployment without webhook configuration.
  const { post, invalidations } = handler("");
  assert.equal((await post(await request({ _type: "post" }))).status, 500);
  assert.deepEqual(invalidations, []);
});
