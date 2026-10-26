import { spawn } from 'node:child_process';

const port = process.env.PROFESSIONALS_WEB_PORT || '3012';
const apiPort = process.env.PROFESSIONALS_FIXTURE_PORT || '4317';
const child = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'dev', '-p', port], {
  stdio: 'inherit',
  env: {
    ...process.env,
    TZ: 'UTC',
    NEXT_DIST_DIR: '.next-professionals-ui',
    NEXT_PUBLIC_API_URL: `http://localhost:${apiPort}`,
  },
});
for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => child.kill(signal));
child.on('exit', code => process.exit(code || 0));
