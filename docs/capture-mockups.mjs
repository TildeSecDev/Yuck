#!/usr/bin/env node
import { chromium } from 'playwright';
import { spawn } from 'child_process';
import { once } from 'events';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const demosDir = path.resolve(repoRoot, 'demos');
const tempVideoDir = path.resolve(demosDir, '.tmp');

await fs.mkdir(demosDir, { recursive: true });
await fs.mkdir(tempVideoDir, { recursive: true });

const mockupIds = ['2', '4', '6', '8'];
const runNotes = [];

function log(message) {
  process.stdout.write(`[capture] ${message}\n`);
}

function startServer(mockupId) {
  const port = 4800 + Number(mockupId);
  const child = spawn('npm', ['run', 'start', `mockups:${mockupId}`], {
    cwd: repoRoot,
    env: { ...process.env, PORT: String(port), HOST: '127.0.0.1' },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  const readyPromise = new Promise((resolve, reject) => {
    let ready = false;
    const onData = data => {
      const text = data.toString();
      process.stdout.write(`[mockup:${mockupId}] ${text}`);
      if (!ready && /Serving mockups\//.test(text)) {
        ready = true;
        resolve({ port });
      }
    };
    child.stdout.on('data', onData);
    child.stderr.on('data', data => {
      process.stderr.write(`[mockup:${mockupId}] ${data}`);
    });
    child.once('exit', code => {
      if (!ready) {
        reject(new Error(`Mockup ${mockupId} server exited early with code ${code}`));
      }
    });
    child.once('error', reject);
  });

  return {
    ready: readyPromise,
    process: child,
    port
  };
}

async function stopServer(child) {
  if (!child || child.killed) return;
  child.kill('SIGTERM');
  await once(child, 'exit').catch(() => {});
}

async function safeAction(mockupId, steps, description, fn) {
  try {
    await fn();
    steps.push(`✔️ ${description}`);
    log(`Mockup ${mockupId}: ${description}`);
  } catch (error) {
    steps.push(`⚠️ ${description} (skipped: ${error.message})`);
    log(`Mockup ${mockupId}: skipped ${description} (${error.message})`);
  }
}

async function tryClick(mockupId, page, steps, locator, description, options = {}) {
  await safeAction(mockupId, steps, description, async () => {
    const target = page.locator(locator).first();
    if (await target.count() === 0) {
      throw new Error('element not found');
    }
    await target.click({ ...options });
    await page.waitForTimeout(400);
  });
}

async function tryFill(mockupId, page, steps, locator, value, description) {
  await safeAction(mockupId, steps, description, async () => {
    const input = page.locator(locator).first();
    if (await input.count() === 0) {
      throw new Error('input not found');
    }
    await input.fill('');
    await input.type(value, { delay: 40 });
    await page.waitForTimeout(300);
  });
}

async function tryPress(mockupId, page, steps, key, description) {
  await safeAction(mockupId, steps, description, async () => {
    await page.keyboard.press(key);
    await page.waitForTimeout(200);
  });
}

async function runScenario(mockupId, page, baseUrl, steps) {
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  steps.push('Opened landing page');
  await page.waitForTimeout(800);
  await page.mouse.wheel(0, 1200);
  steps.push('Scrolled through hero');
  await page.waitForTimeout(400);

  switch (mockupId) {
    case '2':
      await tryClick(mockupId, page, steps, '[data-overlay="search"]', 'Opened quick search overlay');
      await tryFill(mockupId, page, steps, '#searchOverlay input[type="search"]', 'protein', 'Searched for "protein"');
      await tryClick(mockupId, page, steps, '#searchOverlay .spotlight__item', 'Opened first spotlight search result');
      await tryClick(mockupId, page, steps, '#searchOverlay [data-close="search"]', 'Closed search overlay');
      await tryClick(mockupId, page, steps, '.card[data-product="op-16"]', 'Opened primary product card');
      await page.waitForTimeout(400);
      await tryClick(mockupId, page, steps, '[data-action="add-to-cart"]', 'Added product to cart');
      await tryClick(mockupId, page, steps, '[data-overlay="cart"]', 'Opened cart overlay');
      await tryClick(mockupId, page, steps, '[data-close="cart"]', 'Closed cart overlay');
      await tryClick(mockupId, page, steps, 'a[href="./community.html"]', 'Navigated to community page');
      await page.waitForTimeout(500);
      await tryClick(mockupId, page, steps, 'a[href="./index.html"]', 'Returned to landing page');
      await page.waitForTimeout(500);
      break;
    case '4':
      await tryClick(mockupId, page, steps, '[data-open-account]', 'Opened account modal');
      await tryFill(mockupId, page, steps, '#accountLoginEmail', 'athlete@example.com', 'Entered login email');
      await tryFill(mockupId, page, steps, '#accountLoginPassword', 'Recovery123', 'Entered login password');
      await tryClick(mockupId, page, steps, '#accountLoginForm button[type="submit"]', 'Submitted login form');
      await tryPress(mockupId, page, steps, 'Escape', 'Closed account modal');
      await tryClick(mockupId, page, steps, '[data-open-support]', 'Opened support modal');
      await tryFill(mockupId, page, steps, '#supportForm input[name="email"]', 'supporter@yuck.example', 'Provided support email');
      await tryClick(mockupId, page, steps, '#supportSubmit', 'Sent support message');
      await tryPress(mockupId, page, steps, 'Escape', 'Closed support modal');
      await tryClick(mockupId, page, steps, '[data-action="primary"]', 'Initiated Get Yuck CTA');
      await tryClick(mockupId, page, steps, '#buyForm button[type="submit"]', 'Added pack via modal');
      await tryClick(mockupId, page, steps, '#buyModal .modal__close', 'Closed buy modal');
      await tryClick(mockupId, page, steps, 'a.btn[href="community.html"]', 'Viewed community page');
      await page.waitForTimeout(500);
      break;
    case '6':
      await tryClick(mockupId, page, steps, '[data-modal-open="buyModal"]', 'Opened buy modal');
      await tryClick(mockupId, page, steps, '#buyForm .qty-btn[data-qty="1"]', 'Incremented quantity');
      await tryFill(mockupId, page, steps, '#buyQty', '2', 'Updated quantity');
      await tryClick(mockupId, page, steps, '#buyForm button[type="submit"]', 'Added product to cart');
      await tryClick(mockupId, page, steps, '#buyModal .modal-close', 'Closed buy modal');
      await tryClick(mockupId, page, steps, '[data-modal-open="joinModal"]', 'Opened join modal');
      await tryFill(mockupId, page, steps, '#joinModalForm input[name="email"]', 'crew@yuck.example', 'Entered community email');
      await tryClick(mockupId, page, steps, '#joinModalForm button[type="submit"]', 'Submitted join form');
      await tryClick(mockupId, page, steps, '#joinModal .modal-close', 'Closed join modal');
      await tryClick(mockupId, page, steps, '[data-modal-open="supportModal"]', 'Opened support modal');
      await tryFill(mockupId, page, steps, '#supportForm input[name="email"]', 'help@yuck.example', 'Provided support contact');
      await tryClick(mockupId, page, steps, '#supportModal .modal-close', 'Closed support modal');
      await tryClick(mockupId, page, steps, 'nav a[href="products.html"]', 'Explored product lineup');
      await page.waitForTimeout(500);
      break;
    case '8':
      await tryClick(mockupId, page, steps, '.nav-icon[aria-label="Open search"]', 'Opened header search icon');
      await tryClick(mockupId, page, steps, '.nav-icon[aria-label="Open cart"]', 'Opened header cart icon');
      await tryClick(mockupId, page, steps, '.cta.primary[href="#purchase-options"]', 'Jumped to purchase options');
      await tryClick(mockupId, page, steps, '.toggle-btn[data-plan="one-time"]', 'Switched to one-time plan');
      await tryClick(mockupId, page, steps, '.purchase-module [data-action="purchase"]', 'Triggered add to cart');
      await tryFill(mockupId, page, steps, '.community-form input[type="email"]', 'lab@yuck.example', 'Requested community invite');
      await tryClick(mockupId, page, steps, '.community-form button[type="submit"]', 'Submitted community form');
      await tryClick(mockupId, page, steps, '#support details summary', 'Opened first support FAQ entry');
      await tryClick(mockupId, page, steps, '#support details:nth-of-type(2) summary', 'Explored additional support FAQ');
      await page.waitForTimeout(400);
      break;
    default:
      steps.push('No custom scenario for this mockup.');
  }
}

for (const mockupId of mockupIds) {
  log(`Starting capture for mockup ${mockupId}`);
  const server = startServer(mockupId);
  let serverReady;
  try {
    serverReady = await server.ready;
    log(`Server ready for mockup ${mockupId} on port ${serverReady.port}`);
  } catch (error) {
    await stopServer(server.process);
    throw error;
  }

  const baseUrl = `http://127.0.0.1:${serverReady.port}/`;
  const browser = await chromium.launch();
  const context = await browser.newContext({
    recordVideo: { dir: tempVideoDir, size: { width: 1280, height: 720 } }
  });
  const page = await context.newPage();
  const steps = [];

  try {
    await runScenario(mockupId, page, baseUrl, steps);
    const screenshotPath = path.join(demosDir, `mockup-${mockupId}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    steps.push(`Saved screenshot to ${path.relative(repoRoot, screenshotPath)}`);

    const recording = page.video();
    await page.close();
    await context.close();
    await browser.close();

    let finalVideoPath = null;
    if (recording) {
      const rawVideoPath = await recording.path();
      finalVideoPath = path.join(demosDir, `mockup-${mockupId}.webm`);
      await fs.copyFile(rawVideoPath, finalVideoPath);
      steps.push(`Saved recording to ${path.relative(repoRoot, finalVideoPath)}`);
    }

    runNotes.push({
      mockupId,
      baseUrl,
      screenshot: path.basename(screenshotPath),
      video: finalVideoPath ? path.basename(finalVideoPath) : null,
      steps
    });
    log(`Finished interactions for mockup ${mockupId}`);
  } catch (error) {
    steps.push(`❌ Encountered error: ${error.message}`);
    runNotes.push({ mockupId, baseUrl, screenshot: null, video: null, steps });
    await page.close().catch(() => {});
    await context.close().catch(() => {});
    await browser.close().catch(() => {});
  } finally {
    await stopServer(server.process);
    await fs.rm(tempVideoDir, { recursive: true, force: true });
    await fs.mkdir(tempVideoDir, { recursive: true });
  }
}

const notesPath = path.join(demosDir, 'README.md');
const lines = [
  '# Mockup Interaction Demos',
  '',
  'This folder contains automated walkthrough captures for the mockups under `src/mockups/`.',
  '',
  'Run `node docs/capture-mockups.mjs` to regenerate the assets. Generated screenshots and recordings are gitignored to keep the repository lightweight.',
  '',
  'Each session uses Playwright to start the static server (`npm run start mockups:<id>`) and interact with the pages.',
  ''
];

for (const note of runNotes) {
  lines.push(`## Mockup ${note.mockupId}`);
  lines.push('');
  lines.push(`* Served from: ${note.baseUrl}`);
  if (note.screenshot) {
    lines.push(`* Screenshot: \`${note.screenshot}\` (generated artifact)`);
  }
  if (note.video) {
    lines.push(`* Recording: \`${note.video}\` (generated artifact)`);
  }
  lines.push('* Actions:');
  for (const step of note.steps) {
    lines.push(`  * ${step}`);
  }
  lines.push('');
}

await fs.writeFile(notesPath, lines.join('\n'), 'utf8');

log(`Capture complete. Notes written to ${path.relative(repoRoot, notesPath)}`);
