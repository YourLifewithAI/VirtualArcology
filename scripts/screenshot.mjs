/**
 * Headless verification harness.
 *
 * Builds nothing itself — run `npm run build` first. Serves ./dist with
 * `vite preview`, drives the pre-installed Chromium (playwright-core, no
 * browser download) through a set of URL scenarios, and asserts:
 *   - the app reaches __ARC_READY__ with zero console/page errors
 *   - renderer stats stay within draw-call/triangle budgets
 *   - the screenshot is not a blank frame
 * PNGs land in ./screenshots (gitignored) for human review.
 *
 * Usage: node scripts/screenshot.mjs [--out DIR]
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';

const OUT_DIR = process.argv.includes('--out')
  ? process.argv[process.argv.indexOf('--out') + 1]
  : 'screenshots';
const PORT = 4173;

const SCENARIOS = [
  {
    name: 'tessera-demo',
    url: `/?mode=tessera&demo=1&freeze=1`,
    budgets: { maxDrawCalls: 1200, maxTriangles: 2_500_000, minTriangles: 1_000 },
  },
  {
    name: 'tessera-empty',
    url: `/?mode=tessera&empty=1&freeze=1`,
    budgets: { maxDrawCalls: 120, maxTriangles: 500_000, minTriangles: 10 },
  },
  {
    name: 'arcology',
    url: `/?mode=arcology&freeze=1`,
    budgets: { maxDrawCalls: 400, maxTriangles: 4_000_000, minTriangles: 1_000 },
    optional: true, // until arcology mode ships
  },
  {
    name: 'arcology-xray',
    url: `/?mode=arcology&xray=1&shafts=1&freeze=1`,
    budgets: { maxDrawCalls: 400, maxTriangles: 4_000_000, minTriangles: 1_000 },
    optional: true,
  },
  {
    name: 'arcology-cut',
    url: `/?mode=arcology&cut=0.45&shafts=1&freeze=1`,
    budgets: { maxDrawCalls: 400, maxTriangles: 4_000_000, minTriangles: 1_000 },
    optional: true,
  },
];

function findChromium() {
  const roots = [process.env.PLAYWRIGHT_BROWSERS_PATH, '/opt/pw-browsers'].filter(Boolean);
  for (const root of roots) {
    if (!fs.existsSync(root)) continue;
    const entries = fs.readdirSync(root).filter((e) => e.startsWith('chromium'));
    // prefer full chromium over headless_shell
    entries.sort((a, b) => (a.includes('headless') ? 1 : 0) - (b.includes('headless') ? 1 : 0));
    for (const entry of entries) {
      for (const rel of ['chrome-linux/chrome', 'chrome-linux/headless_shell', 'chrome']) {
        const p = path.join(root, entry, rel);
        if (fs.existsSync(p)) return p;
      }
    }
  }
  return null; // let playwright try its default resolution
}

function startPreview() {
  return new Promise((resolve, reject) => {
    const proc = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let settled = false;
    const onData = (data) => {
      if (!settled && String(data).includes('http')) {
        settled = true;
        resolve(proc);
      }
    };
    proc.stdout.on('data', onData);
    proc.stderr.on('data', onData);
    proc.on('exit', (code) => {
      if (!settled) reject(new Error(`vite preview exited early (code ${code})`));
    });
    setTimeout(() => {
      if (!settled) {
        settled = true;
        resolve(proc); // assume it is up; page.goto will fail loudly if not
      }
    }, 5000);
  });
}

async function run() {
  if (!fs.existsSync('dist')) {
    console.error('dist/ not found — run `npm run build` first.');
    process.exit(1);
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const preview = await startPreview();
  const executablePath = findChromium();
  const browser = await chromium.launch({
    executablePath: executablePath ?? undefined,
    args: ['--enable-unsafe-swiftshader'],
  });

  let failures = 0;
  const results = [];

  for (const scenario of SCENARIOS) {
    const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
    const errors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(String(err)));

    const url = `http://localhost:${PORT}${scenario.url}`;
    let ok = true;
    const problems = [];
    let stats = null;
    try {
      await page.goto(url, { waitUntil: 'load', timeout: 30_000 });
      await page.waitForFunction(() => window.__ARC_READY__ === true, null, { timeout: 30_000 });
      await page.waitForTimeout(600); // settle a few frames
      stats = await page.evaluate(() => window.__arc.stats());

      const b = scenario.budgets;
      if (stats.drawCalls > b.maxDrawCalls) problems.push(`draw calls ${stats.drawCalls} > ${b.maxDrawCalls}`);
      if (stats.triangles > b.maxTriangles) problems.push(`triangles ${stats.triangles} > ${b.maxTriangles}`);
      if (stats.triangles < b.minTriangles) problems.push(`triangles ${stats.triangles} < ${b.minTriangles} (blank scene?)`);

      const shotPath = path.join(OUT_DIR, `${scenario.name}.png`);
      const buf = await page.screenshot({ path: shotPath });
      if (buf.length < 20_000) problems.push(`screenshot suspiciously small (${buf.length} bytes) — blank frame?`);

      if (errors.length > 0) problems.push(`console errors: ${errors.slice(0, 3).join(' | ')}`);
    } catch (err) {
      if (scenario.optional && String(err).includes('waitForFunction')) {
        problems.push(`skipped (optional scenario not ready): ${String(err).slice(0, 120)}`);
      } else {
        problems.push(String(err).slice(0, 300));
      }
    }
    await page.close();

    ok = problems.length === 0;
    if (!ok && !scenario.optional) failures++;
    results.push({ name: scenario.name, ok, optional: !!scenario.optional, stats, problems });
  }

  await browser.close();
  preview.kill();

  console.log('\n=== screenshot harness results ===');
  for (const r of results) {
    const flag = r.ok ? 'PASS' : r.optional ? 'SKIP' : 'FAIL';
    const statsStr = r.stats ? ` calls=${r.stats.drawCalls} tris=${r.stats.triangles}` : '';
    console.log(`[${flag}] ${r.name}${statsStr}`);
    for (const p of r.problems) console.log(`       - ${p}`);
  }
  console.log(`PNGs in ${OUT_DIR}/`);
  process.exit(failures > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
