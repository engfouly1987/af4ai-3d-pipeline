// hero page (+ .glb) -> one offline HTML: three.js bundled, GLB embedded as base64, poster as data URI.
// node standalone.mjs site/index.html site/model.glb dist/<slug>.html     (needs esbuild + three@0.169.0 in node_modules)
import fs from 'fs'; import path from 'path'; import * as esbuild from 'esbuild'; import { createRequire } from 'module';
const [src, glb, out] = process.argv.slice(2); let h = fs.readFileSync(src, 'utf8');
const req = createRequire(path.resolve(src)); const threeDir = path.dirname(path.dirname(req.resolve('three')));
const a = h.indexOf('<script type="module">'), b = h.indexOf('</script>', a); let js = h.slice(a + 22, b);
js = js.replace(/async function loadModel\(loader\)\{[\s\S]*?return parseB64\(loader,txt\)\}/, 'async function loadModel(loader){loadBar.style.width="100%";return parseB64(loader,document.getElementById("glb").textContent)}');
if (!js.includes('getElementById("glb")')) throw new Error('loadModel not replaced');
const tmp = path.join(path.dirname(path.resolve(out)), '.entry.js'); fs.mkdirSync(path.dirname(tmp), { recursive: true }); fs.writeFileSync(tmp, js);
const r = await esbuild.build({ entryPoints: [tmp], bundle: true, format: 'esm', minify: true, write: false, platform: 'browser', target: 'es2020',
  alias: { 'three/addons': path.join(threeDir, 'examples/jsm'), 'three': path.join(threeDir, 'build/three.module.js') } });
fs.rmSync(tmp); const code = r.outputFiles[0].text.replaceAll('</script', '<\\/script');
h = h.replace(/<script type="importmap">[\s\S]*?<\/script>/, '');
const a2 = h.indexOf('<script type="module">'), b2 = h.indexOf('</script>', a2) + 9;
const posterFile = path.join(path.dirname(src), 'poster.webp'); const poster = fs.existsSync(posterFile) ? 'data:image/webp;base64,' + fs.readFileSync(posterFile).toString('base64') : '';
h = h.slice(0, a2) + `<script type="text/plain" id="glb">${fs.readFileSync(glb).toString('base64')}</script>\n<script type="module">${code}</script>` + h.slice(b2);
if (poster) h = h.replace('src="poster.webp"', `src="${poster}"`);
fs.writeFileSync(out, h); console.log(out, (fs.statSync(out).size / 1e6).toFixed(2) + ' MB');
