import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import ts from "typescript";

const projectRoot = fileURLToPath(new URL("../../../../", import.meta.url));
const requirePackage = createRequire(import.meta.url);
const modules = new Map();
function load(filename) {
  // The choice catalog is real; only Next's build-time font loader is unnecessary here.
  if (filename === resolve(projectRoot, "src/features/website/fonts.ts")) {
    return { websiteFontFamily: key => key, websiteSans: "sans-serif", websiteMono: "monospace" };
  }
  if (modules.has(filename)) return modules.get(filename);
  const exports = {};
  modules.set(filename, exports);
  const source = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const execute = vm.runInThisContext(`(function(exports, require) {${source}\n})`, { filename });
  execute(exports, specifier => {
    if (!specifier.startsWith(".") && !specifier.startsWith("@/")) return requirePackage(specifier);
    return load(`${specifier.startsWith("@/")
      ? resolve(projectRoot, "src", specifier.slice(2))
      : resolve(dirname(filename), specifier)}.ts`);
  });
  return exports;
}

const { shuffleLook, OPENING_LOOK, NO_LOCKS } = load(fileURLToPath(new URL("./shuffle-model.ts", import.meta.url)));
const { SECTION_TYPES, SECTION_META } = load(resolve(projectRoot, "src/features/website/components/builder/sectionCatalog.ts"));
const { BRAND_ACCENT_CATALOG, FONT_CATALOG } = load(resolve(projectRoot, "src/features/website/components/builder/theme.ts"));
const pools = new Map([
  ...SECTION_TYPES.map(type => [type, SECTION_META[type].variants.map(variant => variant.id)]),
  ["accent", BRAND_ACCENT_CATALOG.map(accent => accent.hex)],
  ["fontKey", FONT_CATALOG.map(font => font.key)],
]);
const valueOf = (look, key) => key === "accent" || key === "fontKey" ? look[key] : look.variants[key];
const lockOf = key => key === "accent" ? "colour" : key === "fontKey" ? "type" : "layout";
function frozenCopy(value) {
  const copy = structuredClone(value);
  const freeze = object => {
    if (object && typeof object === "object") {
      Object.values(object).forEach(freeze);
      Object.freeze(object);
    }
    return object;
  };
  return freeze(copy);
}

test("every section, colour and font explores its full catalog before repeating", t => {
  // A constant random source must still terminate and make progress, including at cycle boundaries.
  t.mock.method(Math, "random", () => 0);
  for (const [key, pool] of pools) {
    let look = OPENING_LOOK;
    let cycle = {};
    const draw = () => {
      const next = shuffleLook(look, NO_LOCKS, cycle);
      const value = valueOf(next.look, key);
      assert.ok(pool.includes(value), `${key}: choice belongs to its catalog`);
      assert.notEqual(value, valueOf(look, key), `${key}: no adjacent repeats`);
      ({ look, cycle } = next);
      return value;
    };
    const initial = [valueOf(look, key)];
    for (let index = 1; index < pool.length; index++) initial.push(draw());
    assert.deepEqual(new Set(initial), new Set(pool), `${key}: initial look counts toward the first round`);
    // Every later bag includes the complete pool, not merely N−1 alternatives to its starting value.
    for (let round = 0; round < 3; round++) {
      const visited = Array.from({ length: pool.length }, draw);
      assert.deepEqual(new Set(visited), new Set(pool), `${key}: complete later round ${round + 1}`);
    }
  }
});

test("all Keep combinations freeze their values and unspent cycle choices", t => {
  t.mock.method(Math, "random", () => .5);
  const first = shuffleLook(OPENING_LOOK, NO_LOCKS);
  for (let mask = 0; mask < 8; mask++) {
    const locks = { layout: !!(mask & 1), colour: !!(mask & 2), type: !!(mask & 4) };
    const next = shuffleLook(first.look, locks, first.cycle);
    for (const [key] of pools) {
      if (locks[lockOf(key)]) {
        assert.equal(valueOf(next.look, key), valueOf(first.look, key), `${key}: kept value`);
        assert.deepEqual(next.cycle[key], first.cycle[key], `${key}: kept cycle progress`);
      } else {
        assert.notEqual(valueOf(next.look, key), valueOf(first.look, key), `${key}: unkept value changes`);
      }
    }
  }
});

test("manual choices are excluded from the next shuffle and remaining choices", t => {
  t.mock.method(Math, "random", () => 0);
  const first = shuffleLook(OPENING_LOOK, NO_LOCKS);
  for (const [key, pool] of pools) {
    const remaining = first.cycle[key]?.remaining ?? [];
    const manuallySelected = remaining[0] ?? pool.find(value => value !== valueOf(first.look, key));
    const manual = structuredClone(first.look);
    if (key === "accent" || key === "fontKey") manual[key] = manuallySelected;
    else manual.variants[key] = manuallySelected;
    const next = shuffleLook(manual, NO_LOCKS, first.cycle);
    assert.notEqual(valueOf(next.look, key), manuallySelected, `${key}: manual choice is respected`);
    if (remaining.length > 1) {
      assert.ok(!next.cycle[key]?.remaining.includes(manuallySelected), `${key}: manual choice counts as already explored in this round`);
    }

    // A manual selection can use the last unspent option. Refill rather than repeating it.
    const finalManual = structuredClone(first.look);
    if (key === "accent" || key === "fontKey") finalManual[key] = pool[0];
    else finalManual.variants[key] = pool[0];
    const boundaryCycle = { ...first.cycle, [key]: { remaining: [pool[0]], previous: pool[1] } };
    const afterBoundary = shuffleLook(finalManual, NO_LOCKS, boundaryCycle);
    assert.notEqual(valueOf(afterBoundary.look, key), pool[0], `${key}: manual completion of a round cannot repeat immediately`);
  }
});

test("shuffle does not mutate its input look, locks or cycle", t => {
  t.mock.method(Math, "random", () => .75);
  const first = shuffleLook(OPENING_LOOK, NO_LOCKS);
  const look = frozenCopy(first.look);
  const locks = frozenCopy(NO_LOCKS);
  const cycle = frozenCopy(first.cycle);
  const before = structuredClone({ look, locks, cycle });
  const next = shuffleLook(look, locks, cycle);
  assert.deepEqual({ look, locks, cycle }, before);
  assert.notStrictEqual(next.look, look);
  assert.notStrictEqual(next.cycle, cycle);
});
