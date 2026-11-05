import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import sharp from "sharp";
import { LOCALES } from "../src/i18n/locales.ts";
import { MARKETING_MOCKUPS } from "../src/lib/marketing/mockups.ts";

const root = fileURLToPath(new URL("../", import.meta.url));

let checked = 0;
for (const [scene, localized] of Object.entries(MARKETING_MOCKUPS)) {
  assert.deepEqual(Object.keys(localized).sort(), [...LOCALES].sort(), `${scene}: all page locales are required`);
  const hashes = [];
  let ratio;
  for (const [locale, asset] of Object.entries(localized)) {
    assert.match(asset.src, /^\/images\//, `${scene}/${locale}: use a local product capture`);
    const bytes = await readFile(path.join(root, "public", asset.src));
    const metadata = await sharp(bytes).metadata();
    assert.equal(metadata.format, "webp", `${scene}/${locale}: expected WebP`);
    assert.equal(metadata.width, asset.width, `${scene}/${locale}: intrinsic width differs from the capture`);
    assert.equal(metadata.height, asset.height, `${scene}/${locale}: intrinsic height differs from the capture`);
    const currentRatio = asset.width / asset.height;
    if (ratio !== undefined) assert.equal(currentRatio, ratio, `${scene}: locale switch must preserve the aspect ratio`);
    ratio = currentRatio;
    const pixels = await sharp(bytes).ensureAlpha().raw().toBuffer();
    hashes.push(createHash("sha256").update(pixels).digest("hex"));
    checked += 1;
  }
  assert.notEqual(localized.en.src, localized.ro.src, `${scene}: the two locales share an asset URL`);
  assert.notEqual(hashes[0], hashes[1], `${scene}: locale files contain identical pixels`);
}

console.log(`Verified ${checked} product captures: locale coverage, files, format, dimensions and stable aspect ratios.`);
