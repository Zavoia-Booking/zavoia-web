import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import { MARKETING_MOCKUPS } from '../src/lib/marketing/mockups.ts';

const origin = (process.env.MARKETING_BASE_URL || 'http://localhost:3001').replace(/\/$/, '');
const output = process.env.MARKETING_CHECK_OUTPUT || '/tmp/zavoia-localized-mockups-verified';
const cookieDomain = new URL(origin).hostname;
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE });
const cases = [
  { name: 'home', route: '', scenes: ['consumerMap', 'consumerSchedule', 'studioBeauty', 'studioPet'], sections: ['#zavoia-app', '#web-studio'] },
  { name: 'business', route: 'for-business', scenes: ['marketplaceServices', 'consumerMap', 'businessCalendarDesktop', 'businessCalendarMobile', 'businessAppAssignments', 'businessAppMarketplace', 'consumerSchedule', 'studioBeauty', 'studioPet'], sections: ['section[aria-labelledby="found-title"]', 'section[aria-labelledby="run-title"]', 'section[aria-labelledby="life-title"]', 'section[aria-labelledby="business-app-title"]', 'section[aria-labelledby="studio-title"]'] },
];
const report = { cases: [], switches: [], failures: [] };
const routeFor = (route, locale) => `${origin}/${locale === 'ro' ? 'ro' : ''}${route ? `${locale === 'ro' ? '/' : ''}${route}` : ''}`;
async function inspect(page, entry, locale) {
  const images = page.locator('img[data-product-scene]');
  assert.equal(await images.count(), entry.scenes.length, `${entry.name}: expected all screenshot placements`);
  const records = [];
  for (const scene of entry.scenes) {
    const image = page.locator(`img[data-product-scene="${scene}"]`);
    assert.equal(await image.count(), 1, `${entry.name}/${scene}: unique placement`);
    await image.scrollIntoViewIfNeeded();
    await image.evaluate(async node => { await node.decode(); });
    const data = await image.evaluate(node => {
      const url = new URL(node.currentSrc);
      return { scene: node.dataset.productScene, locale: node.dataset.productLocale, asset: url.searchParams.get('url') || url.pathname, src: node.currentSrc, loaded: node.complete && node.naturalWidth > 0, width: Number(node.getAttribute('width')), height: Number(node.getAttribute('height')), alt: node.alt, roleLabel: node.closest('[role="img"]')?.getAttribute('aria-label'), box: node.getBoundingClientRect().toJSON() };
    });
    const expected = MARKETING_MOCKUPS[scene][locale];
    assert.equal(data.locale, locale, `${scene}: DOM locale`);
    assert.equal(data.asset, expected.src, `${scene}: actual selected image`);
    assert.equal(data.width, expected.width, `${scene}: intrinsic width`);
    assert.equal(data.height, expected.height, `${scene}: intrinsic height`);
    assert(data.loaded && data.box.width > 0 && data.box.height > 0, `${scene}: rendered capture`);
    assert(data.alt || data.roleLabel, `${scene}: accessible image description`);
    records.push(data);
  }
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  assert(overflow <= 1, `${entry.name}/${locale}: horizontal page overflow ${overflow}`);
  assert.equal(await page.locator('text=Interfața aplicației în engleză.').count(), 0, 'obsolete English-interface caveat');
  return { locale, url: page.url(), records, overflow };
}
async function switchTo(page, locale) {
  const disclosure = page.locator('header details').filter({ has: page.locator(`a[data-locale="${locale}"]`) }).first();
  await disclosure.locator('summary').click();
  await disclosure.locator(`a[data-locale="${locale}"]`).click();
  await page.locator(`html[lang="${locale}"]`).waitFor();
}
try {
  for (const width of [1440, 1024, 768, 390, 320]) for (const entry of cases) for (const locale of ['en', 'ro']) {
    const context = await browser.newContext({ viewport: { width, height: width > 600 ? 1000 : 844 }, reducedMotion: 'reduce' });
    await context.addCookies([{ name: 'zw-consent', value: 'denied', domain: cookieDomain, path: '/' }]);
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const response = await page.goto(routeFor(entry.route, locale), { waitUntil: 'domcontentloaded' });
    assert.equal(response.status(), 200);
    await page.locator(`html[lang="${locale}"]`).waitFor();
    await page.evaluate(() => document.fonts.ready);
    const result = await inspect(page, entry, locale);
    assert.deepEqual(errors, [], 'runtime errors');
    if (width === 1440 || (locale === 'ro' && [390, 320].includes(width))) {
      for (const [i, selector] of entry.sections.entries()) {
        const section = page.locator(selector);
        await section.scrollIntoViewIfNeeded();
        await section.screenshot({ path: `${output}/${entry.name}-${locale}-${width}-${i + 1}.png`, animations: 'disabled' });
      }
    }
    report.cases.push({ page: entry.name, width, ...result, errors });
    console.log(`PASS ${entry.name} ${locale} ${width}px`);
    await context.close();
    await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2));
  }
  for (const entry of cases) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce', deviceScaleFactor: 2 });
    await context.addCookies([{ name: 'zw-consent', value: 'denied', domain: cookieDomain, path: '/' }]);
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(routeFor(entry.route, 'en'), { waitUntil: 'domcontentloaded' });
    const states = [await inspect(page, entry, 'en')];
    await switchTo(page, 'ro');
    states.push(await inspect(page, entry, 'ro'));
    await switchTo(page, 'en');
    states.push(await inspect(page, entry, 'en'));
    // The real language control intentionally replaces history. Add a normal
    // route navigation before checking history restoration of both captures.
    await page.goto(routeFor(entry.route, 'ro'), { waitUntil: 'domcontentloaded' });
    states.push(await inspect(page, entry, 'ro'));
    await page.goBack({ waitUntil: 'domcontentloaded' });
    await page.locator('html[lang="en"]').waitFor();
    states.push(await inspect(page, entry, 'en'));
    await page.goForward({ waitUntil: 'domcontentloaded' });
    await page.locator('html[lang="ro"]').waitFor();
    states.push(await inspect(page, entry, 'ro'));
    assert.deepEqual(errors, [], 'runtime errors during locale navigation');
    report.switches.push({ page: entry.name, states, errors });
    console.log(`PASS ${entry.name} EN→RO→EN + back/forward at DPR2`);
    await context.close();
  }
} catch (error) {
  report.failures.push(error.stack || String(error));
  console.error(error);
  process.exitCode = 1;
} finally {
  await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2));
  await browser.close();
}
