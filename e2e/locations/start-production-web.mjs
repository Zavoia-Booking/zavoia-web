import { spawn } from 'node:child_process';
import { rm } from 'node:fs/promises';

const port = process.env.LOCATIONS_SEO_WEB_PORT || '3016';
const apiPort = process.env.PROFESSIONALS_FIXTURE_PORT || '4321';
const distDir = '.next-locations-seo';
if (process.env.NEXT_DIST_DIR && process.env.NEXT_DIST_DIR !== distDir) {
  throw new Error(`This harness only owns ${distDir}; refusing another build directory.`);
}
const env = {
  ...process.env,
  NODE_ENV: 'production',
  TZ: 'UTC',
  NEXT_TELEMETRY_DISABLED: '1',
  NEXT_DIST_DIR: distDir,
  NEXT_PUBLIC_API_URL: `http://127.0.0.1:${apiPort}`,
  // Use the application's existing unconfigured-CMS behavior. Local .env
  // credentials must never make an isolated regression build query real content.
  NEXT_PUBLIC_SANITY_PROJECT_ID: 'placeholder',
  NEXT_PUBLIC_SANITY_DATASET: 'production',
  NEXT_PUBLIC_GA_ID: '',
  NEXT_PUBLIC_GOOGLE_CLIENT_ID: '',
  NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN: '',
};
let child;
let stopping = false;
for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => {
  stopping = true;
  child?.kill(signal);
});

function run(args) {
  return new Promise((resolve, reject) => {
    child = spawn(process.execPath, ['node_modules/next/dist/bin/next', ...args], { stdio: 'inherit', env });
    child.once('error', reject);
    child.once('exit', (code, signal) => {
      if (stopping) process.exit(0);
      if (code === 0) resolve();
      else reject(new Error(`next ${args[0]} failed (${signal || code})`));
    });
  });
}

try {
  // Fetch-cache entries survive rebuilds. Each run must start from its own
  // empty cache so a previous test cannot pre-populate a new lifecycle case.
  await rm(distDir, { recursive: true, force: true });
  await run(['build']);
  // Next normalizes loopback URLs to localhost. Binding that same hostname
  // keeps the locale rewrite internal instead of proxying it back over HTTP.
  await run(['start', '-p', port, '-H', 'localhost']);
} catch (error) {
  console.error(error);
  process.exit(1);
}
