import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

const require = createRequire(import.meta.url);
const DevServer = require('next/dist/server/dev/next-dev-server').default;
const { FallbackMode } = require('next/dist/lib/fallback');

const locales = ['en', 'ro'];
const routes = [
  { pathname: '/[locale]/for-business', fallbackMode: FallbackMode.NOT_FOUND },
  { pathname: '/[locale]/web-studio', fallbackMode: FallbackMode.BLOCKING_STATIC_RENDER },
  { pathname: '/[locale]/web-studio/demo', fallbackMode: FallbackMode.NOT_FOUND },
  { pathname: '/[locale]/try', fallbackMode: FallbackMode.NOT_FOUND },
];

const concretePaths = (pathname) => locales.map((locale) => pathname.replace('[locale]', locale));
const emptyManifest = () => ({ version: 4, routes: {}, dynamicRoutes: {}, notFoundRoutes: [] });

/**
 * Exercise Next's installed manifest updater, replacing only the expensive
 * compilation worker. Every real writer uses the same temporary manifest.
 * The gate releases distinct route computations together; duplicate callers
 * still go through Next's own static-path coalescing and result continuations.
 */
function createServerContext(distDir, concurrent) {
  const computations = new Set();
  let release;
  const ready = new Promise((resolve) => { release = resolve; });
  const staticPathsCache = new Map();
  staticPathsCache.remove = staticPathsCache.delete.bind(staticPathsCache);

  return {
    dir: process.cwd(),
    distDir,
    nextConfig: { experimental: {} },
    staticPathsCache,
    getStaticPathsWorker() {
      return {
        async loadStaticPaths({ pathname }) {
          const route = routes.find((entry) => entry.pathname === pathname);
          assert.ok(route, `Unexpected test route: ${pathname}`);
          if (concurrent) {
            computations.add(pathname);
            if (computations.size === routes.length) release();
            await ready;
          }
          return {
            prerenderedRoutes: concretePaths(pathname).map((routePath) => ({ pathname: routePath })),
            fallbackMode: route.fallbackMode,
          };
        },
        end() {},
      };
    },
  };
}

function requestStaticPaths(server, pathname, locale) {
  return DevServer.prototype.getStaticPaths.call(server, {
    pathname,
    page: pathname,
    urlPathname: pathname.replace('[locale]', locale),
    isAppPath: true,
    requestHeaders: {},
  });
}

async function assertCompleteManifest(filePath, message) {
  const manifest = JSON.parse(await readFile(filePath, 'utf8'));
  assert.deepEqual(
    Object.keys(manifest.routes).sort(),
    routes.flatMap(({ pathname }) => concretePaths(pathname)).sort(),
    `${message}: every English and Romanian path must survive`,
  );
  assert.deepEqual(
    Object.keys(manifest.dynamicRoutes).sort(),
    routes.map(({ pathname }) => pathname).sort(),
    `${message}: every route definition must survive`,
  );
  for (const { pathname, fallbackMode } of routes) {
    const entry = manifest.dynamicRoutes[pathname];
    assert.equal(entry.fallbackSourceRoute, pathname);
    assert.equal(entry.fallback, fallbackMode === FallbackMode.NOT_FOUND ? false : null);
  }
}

test('Next preserves locale routes and fallback policies when generated sequentially', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'zavoia-manifest-sequential-'));
  const manifestPath = path.join(directory, 'prerender-manifest.json');
  try {
    await writeFile(manifestPath, JSON.stringify(emptyManifest()));
    const server = createServerContext(directory, false);
    for (const { pathname } of routes) {
      const result = await requestStaticPaths(server, pathname, 'en');
      assert.deepEqual(result.staticPaths, concretePaths(pathname));
    }
    await assertCompleteManifest(manifestPath, 'Sequential generation');
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('Next preserves a valid, complete manifest during concurrent locale and duplicate requests', { timeout: 30_000 }, async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'zavoia-manifest-concurrent-'));
  const manifestPath = path.join(directory, 'prerender-manifest.json');
  try {
    for (let round = 1; round <= 100; round++) {
      await writeFile(manifestPath, JSON.stringify(emptyManifest()));
      const server = createServerContext(directory, true);
      const requests = routes.flatMap(({ pathname }) => locales.flatMap((locale) => [
        requestStaticPaths(server, pathname, locale),
        requestStaticPaths(server, pathname, locale),
      ]));
      // Settle every writer before asserting or cleaning its temporary directory.
      const results = await Promise.allSettled(requests);
      const failures = results.filter((result) => result.status === 'rejected');
      assert.equal(failures.length, 0, `Round ${round}: concurrent route generation failed: ${failures.map((result) => result.reason).join('; ')}`);
      await assertCompleteManifest(manifestPath, `Round ${round}`);
    }
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
