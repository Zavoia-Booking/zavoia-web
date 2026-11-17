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

const { authEntryHref, authFlowHref, authRedirectTarget, safeRedirectTarget } = load(resolve(sourceRoot, "lib/auth/redirects.ts"));
const { localizedPathname } = load(resolve(sourceRoot, "i18n/routes.ts"));
const { professionalHref } = load(resolve(sourceRoot, "lib/professionals/urls.ts"));
const origin = "https://zavoia.invalid";
const suffix = "?src=profile%2Fshare&filter=one&filter=two#reviews%20section";

test("professional return URLs follow the selected language and preserve the identifier, query and fragment", () => {
  // Public identifiers include seeded varchar IDs as well as UUIDs.
  for (const id of ["share-professional-fixture", "550e8400-e29b-41d4-a716-446655440000", "profile%2Fencoded"]) {
    for (const source of ["en", "ro"]) {
      for (const selected of ["en", "ro"]) {
        const path = professionalHref(source, id);
        assert.equal(safeRedirectTarget(`${path}${suffix}`, selected, "/help"), `${professionalHref(selected, id)}${suffix}`);
      }
    }
  }
  assert.equal(safeRedirectTarget("/en/professionals/seed-id?src=old#reviews", "ro", "/help"), "/ro/professionals/seed-id?src=old#reviews");
  assert.equal(safeRedirectTarget("/en/professionals/seed-id", "en", "/help"), "/professionals/seed-id");
});

test("profile auth entry keeps its return context after a language change for login and registration", () => {
  for (const mode of ["login", "register"]) {
    for (const [source, selected] of [["en", "ro"], ["ro", "en"]]) {
      const original = `${professionalHref(source, "seed-id")}${suffix}`;
      const entry = new URL(authEntryHref(source, mode, original), origin);
      assert.equal(entry.searchParams.get("mode"), mode);
      assert.equal(entry.searchParams.get("redirect"), original);
      // The language switcher changes the auth URL and carries its query intact.
      entry.pathname = localizedPathname(entry.pathname, selected);
      assert.equal(authRedirectTarget(entry.searchParams, selected), `${professionalHref(selected, "seed-id")}${suffix}`);
    }
  }
});

test("auth recovery and mode navigation retain professional return context without carrying unrelated tokens", () => {
  for (const [source, selected] of [["en", "ro"], ["ro", "en"]]) {
    let params = new URL(authEntryHref(source, "login", `${professionalHref(source, "seed-id")}${suffix}`), origin).searchParams;
    params.set("src", "profile");
    params.set("token", "do-not-propagate");
    for (const step of ["forgot-password", "register", "login"]) {
      const url = new URL(authFlowHref(selected, step, params), origin);
      assert.equal(url.pathname, selected === "ro" ? "/ro/auth" : "/auth");
      assert.equal(url.searchParams.get("src"), "profile");
      assert.equal(url.searchParams.has("token"), false);
      assert.equal(url.searchParams.get("forgot"), step === "forgot-password" ? "1" : null);
      assert.equal(authRedirectTarget(url.searchParams, selected), `${professionalHref(selected, "seed-id")}${suffix}`);
      params = url.searchParams;
    }
  }
});

test("existing shared routes retain selected-language return behavior", () => {
  for (const path of ["/", "/search", "/account", "/business/venue", "/brand/merchant", "/appointments/booking", "/terms/privacy-policy"]) {
    const ro = localizedPathname(path, "ro");
    assert.equal(safeRedirectTarget(`${path}${suffix}`, "ro", "/help"), `${ro}${suffix}`);
    assert.equal(safeRedirectTarget(`${ro}${suffix}`, "en", "/help"), `${path}${suffix}`);
  }
});

test("opaque translated paths remain exact unless the page supplies a selected-language alternate", () => {
  for (const path of ["/blog/an-english-title", "/bucharest/hair-salon", "/ro/blog/un-titlu-romanesc", "/professionals/id/nested"]) {
    assert.equal(safeRedirectTarget(`${path}${suffix}`, "ro", "/help"), `${path}${suffix}`);
  }
  const entry = new URL(authEntryHref("en", "login", `/blog/an-english-title${suffix}`, {
    en: "/blog/an-english-title", ro: "/ro/blog/un-titlu-romanesc",
  }), origin);
  const recovery = new URL(authFlowHref("ro", "forgot-password", entry.searchParams), origin);
  assert.equal(authRedirectTarget(recovery.searchParams, "ro"), `/ro/blog/un-titlu-romanesc${suffix}`);
  assert.equal(authRedirectTarget(recovery.searchParams, "en"), `/blog/an-english-title${suffix}`);
});

test("unsafe destinations and unsafe selected-language alternates cannot escape the local fallback", () => {
  for (const unsafe of ["https://evil.invalid/", "//evil.invalid/", "/\\evil.invalid/", "javascript:alert(1)", "/\n/evil.invalid/", "/..//evil.invalid/"]) {
    assert.equal(safeRedirectTarget(unsafe, "ro", "/professionals/seed-id"), "/ro/professionals/seed-id", unsafe);
    assert.equal(safeRedirectTarget(unsafe, "ro", unsafe), "/ro", unsafe);
    const params = new URLSearchParams({ redirect: `/professionals/seed-id${suffix}`, "redirect.ro": unsafe });
    assert.equal(authRedirectTarget(params, "ro"), `/ro/professionals/seed-id${suffix}`, unsafe);
    const entry = new URL(authEntryHref("ro", "login", "/professionals/seed-id", { ro: unsafe }), origin);
    assert.equal(entry.searchParams.has("redirect.ro"), false, unsafe);
  }
  assert.equal(authRedirectTarget(new URLSearchParams(), "ro"), "/ro");
  assert.equal(authRedirectTarget(new URLSearchParams(), "en"), "/");
});
