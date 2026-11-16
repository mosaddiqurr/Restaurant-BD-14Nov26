/* Makes the app icons public/icon-192.png and public/icon-512.png from public/icon.svg, with no extra packages:
   it draws the logo in the headless Microsoft Edge (or Chrome) that is already on the computer and saves a picture.
   The PNGs fill the whole square (no rounded corners), so phones can shape them (maskable); the mark stays
   inside the safe middle. Run: node scripts/icons-png.mjs */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const BROWSERS = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/microsoft-edge',
];
const exe = BROWSERS.find(p => fs.existsSync(p));
if (!exe) { console.error('No Edge or Chrome found.'); process.exit(1); }

const svg = fs.readFileSync('public/icon.svg', 'utf8').replace(/\srx="[\d.]+"/, ''); /* full square */
const port = 9400 + Math.floor(Math.random() * 300);
const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'khabo-icons-'));
const browser = spawn(exe, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`, '--no-first-run', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let ver;
for (let i = 0; i < 80 && !ver; i++) { try { ver = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json(); } catch { await sleep(250); } }
const ws = new WebSocket(ver.webSocketDebuggerUrl);
await new Promise(r => { ws.onopen = r; });
let id = 0; const wait = new Map();
ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && wait.has(m.id)) { wait.get(m.id)(m); wait.delete(m.id); } };
const send = (method, params = {}, sessionId) => new Promise(r => { const i = ++id; wait.set(i, r); ws.send(JSON.stringify({ id: i, method, params, sessionId })); });

const { result: { targetId } } = await send('Target.createTarget', { url: 'about:blank' });
const { result: { sessionId: s } } = await send('Target.attachToTarget', { targetId, flatten: true });
await send('Page.enable', {}, s);
for (const size of [192, 512]) {
  await send('Emulation.setDeviceMetricsOverride', { width: size, height: size, deviceScaleFactor: 1, mobile: false }, s);
  const html = `<!doctype html><html><body style="margin:0;background:transparent">${svg.replace('<svg ', `<svg width="${size}" height="${size}" style="display:block" `)}</body></html>`;
  await send('Page.navigate', { url: 'data:text/html;base64,' + Buffer.from(html).toString('base64') }, s);
  await sleep(600);
  await send('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } }, s);
  const shot = await send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: size, height: size, scale: 1 } }, s);
  fs.writeFileSync(`public/icon-${size}.png`, Buffer.from(shot.result.data, 'base64'));
  console.log(`public/icon-${size}.png`);
}
ws.close(); browser.kill();
setTimeout(() => { try { fs.rmSync(prof, { recursive: true, force: true }); } catch { /* the browser may still hold it */ } }, 500);
