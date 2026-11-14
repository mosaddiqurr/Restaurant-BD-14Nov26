// Headless Edge screenshots over CDP. Usage: node shot.mjs jobs.json
// jobs: [{ name, url, w, h, mobile, dark, wait, js, full }]
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const here = path.dirname(decodeURIComponent(new URL(import.meta.url).pathname)).replace(/^\/([A-Z]:)/, '$1');
const jobs = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const prof = path.join(here, 'prof');
const tmp = path.join(here, 'tmp'); fs.mkdirSync(tmp, { recursive: true });
const port = 9333;
const edge = spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', [
  '--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`, '--no-first-run', '--disable-gpu-sandbox', '--hide-scrollbars=false', 'about:blank'
], { env: { ...process.env, TEMP: tmp, TMP: tmp }, stdio: 'ignore' });

const sleep = ms => new Promise(r => setTimeout(r, ms));
let ver;
for (let i = 0; i < 60; i++) { try { ver = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json(); break; } catch { await sleep(250); } }
const ws = new WebSocket(ver.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
let id = 0; const wait = new Map();
ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && wait.has(m.id)) { wait.get(m.id)(m); wait.delete(m.id); } };
const send = (method, params = {}, sessionId) => new Promise(r => { const i = ++id; wait.set(i, r); ws.send(JSON.stringify({ id: i, method, params, sessionId })); });

const errors = [];
for (const j of jobs) {
  const { result: { targetId } } = await send('Target.createTarget', { url: 'about:blank' });
  const { result: { sessionId: s } } = await send('Target.attachToTarget', { targetId, flatten: true });
  await send('Runtime.enable', {}, s);
  const w = j.w || 1440, h = j.h || 900, mobile = !!j.mobile;
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile }, s);
  if (mobile) await send('Emulation.setTouchEmulationEnabled', { enabled: true }, s);
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: j.dark ? 'dark' : 'light' }] }, s);
  await send('Page.enable', {}, s);
  await send('Page.navigate', { url: j.url }, s);
  await sleep(j.wait || 2500);
  if (j.js) { const r = await send('Runtime.evaluate', { expression: j.js, awaitPromise: true, returnByValue: true }, s); if (r.result && r.result.result && r.result.result.value !== undefined) console.log(j.name, '=>', JSON.stringify(r.result.result.value)); if (r.result && r.result.exceptionDetails) console.log(j.name, 'JS ERR', r.result.exceptionDetails.text); await sleep(j.after ?? 900); }
  const ex = await send('Runtime.evaluate', { expression: 'JSON.stringify(window.__errs||[])', returnByValue: true }, s);
  const shot = await send('Page.captureScreenshot', { format: 'jpeg', quality: 80, captureBeyondViewport: !!j.full, ...(j.clip ? { clip: j.clip } : {}) }, s);
  fs.writeFileSync(path.join(here, j.name + '.jpg'), Buffer.from(shot.result.data, 'base64'));
  await send('Target.closeTarget', { targetId });
}
ws.close(); edge.kill();
console.log('done', jobs.length);
