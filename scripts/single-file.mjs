// Fold the built site into one HTML file: styles, script and fonts inline.
// Usage: npm run build && node scripts/single-file.mjs [out.html]
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const out = process.argv[2] ?? join(dist, 'bottega.html');
const asset = (url) => join(dist, url.replace(/^\/bottega\//, ''));

let html = readFileSync(join(dist, 'index.html'), 'utf8');

const cssTag = html.match(/<link rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/);
const jsTag = html.match(/<script type="module"[^>]*src="([^"]+)"[^>]*><\/script>/);
if (!cssTag || !jsTag) throw new Error('built index.html does not look as expected');

const css = readFileSync(asset(cssTag[1]), 'utf8')
  // the older font format is a fallback nobody opening this file needs
  .replace(/,\s*url\([^)]+\.woff\)\s*format\("woff"\)/g, '')
  .replace(/url\(([^)]+\.woff2)\)/g, (_, url) => {
    const data = readFileSync(asset(url)).toString('base64');
    return `url(data:font/woff2;base64,${data})`;
  });
const js = readFileSync(asset(jsTag[1]), 'utf8').replace(/<\/script/g, '<\\/script');

html = html.replace(jsTag[0], '').replace(cssTag[0], () => `<style>${css}</style>`);
html = html.replace('</body>', () => `<script type="module">${js}</script>\n  </body>`);
if (/\/bottega\/assets\//.test(html)) throw new Error('an asset is still linked, not inlined');

writeFileSync(out, html);
console.log(`${out}: ${(html.length / 1024).toFixed(0)} kB`);
