#!/usr/bin/env node
import { createServer } from 'http';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function parseMockupArg(argv) {
  const extras = argv.slice(2).filter(Boolean);
  if (extras.length === 0) {
    return null;
  }
  for (const extra of extras) {
    const match = /^mockups:(\d+)$/i.exec(extra);
    if (match) {
      return match[1];
    }
  }
  return null;
}

const mockupId = parseMockupArg(process.argv);
if (!mockupId) {
  console.error('Usage: npm run start mockups:<id>');
  process.exitCode = 1;
  process.exit();
}

const repoRoot = path.resolve(__dirname, '..');
const mockupRoot = path.resolve(repoRoot, 'src', 'mockups', mockupId);

await fs
  .stat(mockupRoot)
  .catch(() => {
    console.error(`Mockup directory not found: src/mockups/${mockupId}`);
    process.exit(1);
  });

const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || '127.0.0.1';

const mimeTypes = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.webmanifest', 'application/manifest+json; charset=utf-8'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.gif', 'image/gif'],
  ['.svg', 'image/svg+xml'],
  ['.webp', 'image/webp'],
  ['.woff', 'font/woff'],
  ['.woff2', 'font/woff2'],
  ['.ttf', 'font/ttf'],
  ['.otf', 'font/otf'],
  ['.mp4', 'video/mp4'],
  ['.mp3', 'audio/mpeg'],
  ['.ico', 'image/x-icon']
]);

function resolveRequestPath(url) {
  try {
    const { pathname } = new URL(url, pathToFileURL(mockupRoot));
    return decodeURIComponent(pathname);
  } catch (error) {
    return '/';
  }
}

const server = createServer(async (req, res) => {
  const requestPath = resolveRequestPath(req.url || '/');
  let relative = requestPath;
  if (relative.endsWith('/')) {
    relative += 'index.html';
  }
  const filePath = path.join(mockupRoot, relative);
  const normalized = path.normalize(filePath);
  if (!normalized.startsWith(mockupRoot)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  try {
    const stat = await fs.stat(normalized);
    if (stat.isDirectory()) {
      const directoryIndex = path.join(normalized, 'index.html');
      await fs.access(directoryIndex);
      const data = await fs.readFile(directoryIndex);
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(data);
      return;
    }
    const ext = path.extname(normalized).toLowerCase();
    const contentType = mimeTypes.get(ext) || 'application/octet-stream';
    const data = await fs.readFile(normalized);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      res.writeHead(404);
      res.end('Not Found');
    } else {
      res.writeHead(500);
      res.end('Internal Server Error');
    }
  }
});

server.listen(port, host, () => {
  const url = `http://${host}:${port}/`;
  console.log(`Serving mockups/${mockupId} at ${url}`);
  console.log('Press Ctrl+C to stop.');
});

const signals = ['SIGINT', 'SIGTERM'];
for (const signal of signals) {
  process.on(signal, () => {
    server.close(() => process.exit(0));
  });
}
