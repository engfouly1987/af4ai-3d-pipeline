// Prepare an external (e.g. Codex) GLB for the AF4AI pipeline.
// node prep-glb.mjs in.glb outdir name [--add extra.glb] [--drop NAME1,NAME2] [--usage NAME=usage,...]
// Writes <name>.glb (full, + additions, - dropped) and <name>-desktop.glb (hero: phase-tagged S|T|O|F|R|L materials,
// basements removed, meshopt-compressed). Phase comes from node extras.usage, then material name.
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS, EXTMeshoptCompression } from '@gltf-transform/extensions';
import { prune, weld, meshopt, mergeDocuments, unpartition } from '@gltf-transform/functions';
import { MeshoptEncoder, MeshoptDecoder } from 'meshoptimizer';
import fs from 'fs';
await MeshoptEncoder.ready; await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder });
const [inp, outdir, name] = process.argv.slice(2);
const opt = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
fs.mkdirSync(outdir, { recursive: true });
const USAGE_MAP = Object.fromEntries((opt('--usage') || '').split(',').filter(Boolean).map(s => s.split('=')));
const DROP = (opt('--drop') || '').split(',').filter(Boolean);

async function load() {
  const doc = await io.read(inp);
  const scene = doc.getRoot().listScenes()[0];
  if (opt('--add')) {
    const add = await io.read(opt('--add'));
    mergeDocuments(doc, add);
    const scenes = doc.getRoot().listScenes();
    for (const s of scenes.slice(1)) { for (const c of s.listChildren()) { s.removeChild(c); scene.addChild(c); } s.dispose(); }
    await doc.transform(unpartition());
  }
  for (const n of scene.listChildren()) if (DROP.some(d => n.getName().startsWith(d))) n.dispose();
  for (const [k, hex] of (opt('--recolor') || '').split(',').filter(Boolean).map(x => x.split('='))) {
    const m = doc.getRoot().listMaterials().find(m => m.getName() === k);
    if (m) m.setBaseColorFactor([...[1, 3, 5].map(i => Math.pow(parseInt(hex.slice(i, i + 2), 16) / 255, 2.2)), m.getBaseColorFactor()[3]]);
  }
  for (const n of scene.listChildren()) { const u = Object.entries(USAGE_MAP).find(([k]) => n.getName().startsWith(k)); if (u) n.setExtras({ ...n.getExtras(), usage: u[1] }); }
  return doc;
}

// full model
let doc = await load();
await doc.transform(prune());
await io.write(`${outdir}/${name}.glb`, doc);

// hero model
doc = await load();
const root = doc.getRoot(), scene = root.listScenes()[0];
const usageOf = n => { let p = n; while (p) { const u = p.getExtras()?.usage; if (u) return u; p = p.getParentNode?.() || null; } return ''; };
for (const n of scene.listChildren()) if (/basement/i.test(usageOf(n)) || /^B\d|BASEMENT|PARKING_RAMP/i.test(n.getName())) n.dispose();
const phase = (usage, m) => {
  if (/^(site|parking|sea|routes|boardwalk)$/.test(usage)) return 'S';
  if (/^(landscape|context|furniture|garden)$/.test(usage)) return 'L';
  if (/^(roof|crown)$/.test(usage)) return 'R';
  if (/glass|rail/i.test(m)) return 'O';
  if (usage === 'facade' || /bronze|wood|green|leaf|screen|fin/i.test(m)) return 'F';
  return 'T';
};
const matCache = new Map(), meshCache = new Map(), counts = {};
const tagged = (mat, ph) => {
  const key = mat.getName() + '|' + ph;
  if (!matCache.has(key)) { const nm = /glass/i.test(mat.getName()) ? 'Glass_' + mat.getName() : mat.getName(); matCache.set(key, mat.clone().setName(`${ph}|${nm}`)); }
  return matCache.get(key);
};
scene.traverse(n => {
  const mesh = n.getMesh(); if (!mesh) return;
  const usage = usageOf(n);
  const sig = mesh.listPrimitives().map(p => phase(usage, p.getMaterial()?.getName() || '')).join('');
  const key = mesh.getName() + '#' + root.listMeshes().indexOf(mesh) + '#' + sig;
  if (!meshCache.has(key)) {
    const m2 = doc.createMesh(mesh.getName());
    mesh.listPrimitives().forEach((p, i) => { const q = p.clone(); const mt = p.getMaterial(); if (mt) q.setMaterial(tagged(mt, sig[i])); m2.addPrimitive(q); counts[sig[i]] = (counts[sig[i]] || 0) + 1; });
    meshCache.set(key, m2);
  }
  n.setMesh(meshCache.get(key));
});
await doc.transform(prune(), weld(), meshopt({ encoder: MeshoptEncoder, level: 'medium' }));
await io.write(`${outdir}/${name}-desktop.glb`, doc);
console.log('full', fs.statSync(`${outdir}/${name}.glb`).size, 'hero', fs.statSync(`${outdir}/${name}-desktop.glb`).size, 'phase prims', counts);
