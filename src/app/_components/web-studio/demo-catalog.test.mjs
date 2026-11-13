import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import ts from "typescript";

const projectRoot = fileURLToPath(new URL("../../../../", import.meta.url));
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
    ? resolve(projectRoot, "src", specifier.slice(2))
    : resolve(dirname(filename), specifier)}.ts`));
  return exports;
}

const { DEMO_EXAMPLES, demoExampleData } = load(fileURLToPath(new URL("./demo-examples.ts", import.meta.url)));

for (const { id } of DEMO_EXAMPLES) {
  test(`${id}: all three branches have complete bilingual menus, packages and assigned teams`, () => {
    const en = demoExampleData("en", "#C2552F", "playfair", id);
    const ro = demoExampleData("ro", "#C2552F", "playfair", id);
    assert.equal(en.businessName, ro.businessName);
    assert.equal(en.locations.length, 3);
    assert.equal(ro.locations.length, 3);
    assert.equal(new Set(en.locations.map(location => location.id)).size, 3);
    assert.equal(new Set(en.locations.map(location => location.name)).size, 3);
    assert.notEqual(en.aboutContent, ro.aboutContent);

    for (const [index, branch] of en.locations.entries()) {
      const translated = ro.locations[index];
      assert.equal(branch.id, translated.id);
      assert.notEqual(branch.description, translated.description);
      assert.ok(branch.description.length >= 40);
      assert.ok(translated.description.length >= 40);
      assert.equal(branch.teamMembers.length, 3);
      assert.equal(new Set(branch.teamMembers.map(member => member.id)).size, 3);
      for (const member of branch.teamMembers) {
        assert.ok(member.firstName && member.lastName);
        assert.match(member.profileImage, /^\/images\/marketing\/examples\/team\/portrait-0[1-7]\.webp$/);
        assert.ok(existsSync(resolve(projectRoot, "public", member.profileImage.slice(1))), member.profileImage);
        assert.equal(member.profileImage, translated.teamMembers.find(other => other.id === member.id)?.profileImage);
      }
      assert.equal(branch.services.length, translated.services.length);
      assert.equal(new Set(branch.services.map(service => service.name)).size, branch.services.length);
      const categories = new Map();
      for (const service of branch.services) {
        assert.ok(service.name && service.description.length >= 30);
        assert.ok(Number.isInteger(service.duration) && service.duration > 0);
        assert.ok(Number.isInteger(service.price_amount_minor) && service.price_amount_minor >= 0);
        assert.equal(service.categoryId, service.category.id);
        categories.set(service.categoryId, (categories.get(service.categoryId) ?? 0) + 1);
        const other = translated.services.find(item => item.id === service.id);
        assert.ok(other?.name && other.description.length >= 30);
        assert.notEqual(service.name, other.name);
        assert.equal(other.categoryId, service.categoryId);
      }
      assert.ok(categories.size >= 5);
      assert.ok([...categories.values()].every(count => count >= 4));
      assert.ok(branch.bundles.length >= 4);
      for (const bundle of branch.bundles) {
        assert.ok(bundle.name && bundle.description.length >= 30);
        assert.ok(bundle.services.length >= 2);
        const included = bundle.services.map(item => branch.services.find(service => service.name === item.name));
        assert.ok(included.every(Boolean));
        assert.equal(bundle.duration, included.reduce((total, service) => total + service.duration, 0));
        assert.ok(Number.isInteger(bundle.price_amount_minor) && bundle.price_amount_minor >= 0);
        const other = translated.bundles.find(item => item.id === bundle.id);
        assert.ok(other && other.name !== bundle.name);
        assert.ok(other.services.every(item => translated.services.some(service => service.name === item.name)));
      }
      assert.ok(branch.portfolioImages.every(image => existsSync(resolve(projectRoot, "public", image.url.slice(1)))));
      assert.ok(branch.portfolioImages.some(image => image.url === branch.featuredImage));
      assert.equal(branch.totalReviews, 0);
    }
    const members = new Map(en.locations.flatMap(location => location.teamMembers).map(member => [member.id, member]));
    assert.equal(members.size, 5);
    assert.equal(new Set([...members.values()].map(member => member.profileImage)).size, 5);
  });
}
