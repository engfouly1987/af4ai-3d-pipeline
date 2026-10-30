// Render the 3D segment of a video frame by frame from hero-video.html (the empty page: no buttons, no stages).
//   node render-frames.mjs video.json            → cloud / Linux (Chromium + SwiftShader, slow, resumable)
//   node render-frames.mjs video.json --local    → on the user's Windows PC with Microsoft Edge + real GPU (fast)
// video.json: {"site":"site","out":"frames","w":1080,"h":1920,"fps":24,"dur":6.2,
//   "keys":[[0,{"az":2.25,"el":0.9,"d":1.9,"h":0.05}],[1,{"az":3.1,"el":0.5,"d":1.4,"h":0.12}]],   // camera path (azimuth, elevation, distance×R, target height 0..1)
//   "build":[0.06,0.85],                                                                          // build progress p goes 0.06→1 over the first 85% of the clip
//   "abs":{"pos":[0,205,-335],"tgt":[0,0,-5],"fov":46,"from":0.55}}                               // optional: blend to an exact camera (AI render / Veo framing)
import { chromium } from 'playwright-core'; import http from 'http'; import fs from 'fs'; import path from 'path';
const cfgPath = process.argv[2] || 'video.json'; const local = process.argv.includes('--local');
const C = JSON.parse(fs.readFileSync(cfgPath, 'utf8')); const base = path.dirname(path.resolve(cfgPath));
const SITE = path.resolve(base, C.site || 'site'), OUT = path.resolve(base, C.out || 'frames');
const W = C.w || 1080, H = C.h || 1920, FPS = C.fps || 24, N = Math.round((C.dur || 6) * FPS);
const ss = t => t * t * (3 - 2 * t), cl = v => Math.max(0, Math.min(1, v));
const K = C.keys; const camAt = u => { let i = 0; while (i < K.length - 2 && u > K[i + 1][0]) i++; const [a, A] = K[i], [b, B] = K[i + 1]; const k = ss(cl((u - a) / (b - a))); const o = {}; for (const key in A) o[key] = A[key] + (B[key] - A[key]) * k; return o };
const [p0, pEnd] = C.build || [0.06, 0.85];
// three.js comes from node_modules (no CDN needed): /node_modules/... is served from the first node_modules found upward
let NM = base; while (!fs.existsSync(path.join(NM, 'node_modules', 'three')) && path.dirname(NM) !== NM) NM = path.dirname(NM);
const type = f => f.endsWith('.html') ? 'text/html; charset=utf-8' : f.endsWith('.js') || f.endsWith('.mjs') ? 'text/javascript' : 'application/octet-stream';
const srv = http.createServer((q, s) => { const p = decodeURIComponent(q.url.split('?')[0]); const f = p.startsWith('/node_modules') ? path.join(NM, p) : path.join(SITE, p);
  try { let d = fs.readFileSync(f); if (p.endsWith('.html')) d = '<script>window.__manual=true</script>' + d; s.writeHead(200, { 'Content-Type': type(f) }); s.end(d) } catch { s.writeHead(404); s.end() } }).listen(0);
const port = srv.address().port;
const b = local ? await chromium.launch({ channel: 'msedge', args: ['--ignore-gpu-blocklist'] })
  : await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const pg = await b.newPage({ viewport: { width: W, height: H }, colorScheme: 'light' }); pg.on('pageerror', e => console.log('ERR', e.message));
await pg.goto(`http://localhost:${port}/${C.page || 'video.html'}`); await pg.waitForFunction(() => window.__renderOnce, null, { timeout: 600000 });
await pg.evaluate(() => { window.__snap = true; document.querySelectorAll('.ctl,.logo,.phases,#hint').forEach(e => e.style.display = 'none'); const pp = document.querySelector('#poster'); if (pp) pp.style.display = 'none' });
fs.mkdirSync(OUT, { recursive: true }); const t0 = Date.now(); let done = 0;
for (let n = 0; n < N; n++) { const out = path.join(OUT, String(n).padStart(4, '0') + '.jpg'); if (fs.existsSync(out)) continue;   // resumable
  const u = n / (N - 1), p = p0 + (1 - p0) * ss(cl(u / pEnd)); const ka = C.abs ? ss(cl((u - (C.abs.from ?? .55)) / (1 - (C.abs.from ?? .55)))) : 0;
  await pg.evaluate(([p, c, a]) => { window.__p = p; window.__cam = c; window.__abs = a; window.__renderOnce() }, [p, camAt(u), ka > 0 ? { ...C.abs, k: ka } : null]);
  await pg.screenshot({ path: out, type: 'jpeg', quality: 93, timeout: 300000 }); done++;
  if (done % 24 === 0) console.log(`${n + 1}/${N}  ${((Date.now() - t0) / done / 1000).toFixed(2)} s/frame`); }
console.log('rendered', done, 'frames in', ((Date.now() - t0) / 1000).toFixed(0) + ' s →', OUT); await b.close(); srv.close();
