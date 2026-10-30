// GLB -> SketchUp Ruby script. Each glTF mesh becomes a component definition (faces via PolygonMesh + fill_from_mesh,
// soft/smooth edges), each node an instance with its full transform. Y-up metres -> SketchUp Z-up inches.
// node glb2rb.mjs in.glb out.rb "Title" [--skip NAME1,NAME2]
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder } from 'meshoptimizer';
import fs from 'fs';
await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
const [inp, out, title = 'AF4AI Model'] = process.argv.slice(2);
const si = process.argv.indexOf('--skip'); const SKIP = si > 0 ? process.argv[si + 1].split(',') : [];
const doc = await io.read(inp); const root = doc.getRoot();
const pre = title.replace(/[^A-Za-z0-9]+/g, '');
const IN = 39.37007874;
const r4 = v => (Math.round(v * 1000) / 1000).toString();
const L = [];
L.push(`# ${title} (AF4AI) - generated from GLB. Paste into Extensions > Developer > Ruby Console, or: load 'path/to/this.rb'
model = Sketchup.active_model
model.start_operation('AF4AI ${title}', true)
M = {}
def mk(model, name, rgb, alpha)
  m = model.materials[name] || model.materials.add(name)
  m.color = Sketchup::Color.new(*rgb); m.alpha = alpha; m
end
def mesh_def(model, name, prims)
  d = model.definitions.add(name)
  prims.each do |mat, pts, tris|
    pm = Geom::PolygonMesh.new(pts.length / 3, tris.length / 3)
    idx = []
    (0...pts.length / 3).each { |i| idx << pm.add_point(Geom::Point3d.new(pts[3 * i], pts[3 * i + 1], pts[3 * i + 2])) }
    (0...tris.length / 3).each { |t| a, b, c = tris[3 * t], tris[3 * t + 1], tris[3 * t + 2]; pm.add_polygon(idx[a], idx[b], idx[c]) rescue nil }
    d.entities.fill_from_mesh(pm, true, Geom::PolygonMesh::AUTO_SOFTEN | Geom::PolygonMesh::SMOOTH_SOFT_EDGES, M[mat], M[mat])
  end
  d
end
def tr(a) Geom::Transformation.new(a) end
`);
root.listMaterials().forEach(m => {
  const c = m.getBaseColorFactor(); const rgb = c.slice(0, 3).map(v => Math.round(Math.pow(v, 1 / 2.2) * 255));
  L.push(`M['${m.getName()}'] = mk(model, '${pre}_${m.getName().replace(/[^A-Za-z0-9_|]/g, '_')}', [${rgb}], ${m.getAlphaMode() === 'BLEND' ? +c[3].toFixed(2) : 1})`);
});
const defName = new Map(); let k = 0;
for (const mesh of root.listMeshes()) {
  const nm = `D${k++}`; defName.set(mesh, nm);
  const prims = mesh.listPrimitives().map(p => {
    const pos = p.getAttribute('POSITION').getArray(); const idx = p.getIndices() ? p.getIndices().getArray() : Array.from({ length: pos.length / 3 }, (_, i) => i);
    const pts = []; for (let i = 0; i < pos.length; i += 3) pts.push(r4(pos[i] * IN), r4(-pos[i + 2] * IN), r4(pos[i + 1] * IN));
    return `['${p.getMaterial()?.getName() || ''}',[${pts.join(',')}],[${Array.from(idx).join(',')}]]`;
  });
  L.push(`${nm} = mesh_def(model, '${pre} ${(mesh.getName() || nm).replace(/'/g, '')}', [${prims.join(',')}])`);
}
// node world transforms; three -> SU basis change B = [x,-z,y]; T_su = B * T * B^-1 (translations scaled to inches)
const mul = (a, b) => { const r = new Array(16).fill(0); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) for (let q = 0; q < 4; q++) r[j * 4 + i] += a[q * 4 + i] * b[j * 4 + q]; return r; };
const B = [1, 0, 0, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 1], Bi = [1, 0, 0, 0, 0, 0, -1, 0, 0, 1, 0, 0, 0, 0, 0, 1];
const groups = {};
root.listScenes()[0].traverse(n => {
  const mesh = n.getMesh(); if (!mesh) return;
  let top = n; while (top.getParentNode()) top = top.getParentNode();
  if (SKIP.some(s => top.getName().startsWith(s))) return;
  const m = mul(mul(B, n.getWorldMatrix()), Bi); m[12] *= IN; m[13] *= IN; m[14] *= IN;
  const g = top.getName().replace(/_?-?\d+(_-?\d+)?$/, '') || 'MODEL';
  (groups[g] ??= []).push(`e.add_instance(${defName.get(mesh)}, tr([${m.map(v => +v.toFixed(5)).join(',')}]))`);
});
for (const [g, lines] of Object.entries(groups)) { L.push(`gp = model.active_entities.add_group; gp.name = '${g.replace(/'/g, '')}'; e = gp.entities`); L.push(...lines); }
L.push(`model.commit_operation\nmodel.active_view.zoom_extents\nputs 'AF4AI ${title} built.'`);
fs.writeFileSync(out, L.join('\n'));
console.log(out, (fs.statSync(out).size / 1e6).toFixed(2) + ' MB', 'defs', k, 'groups', Object.keys(groups).length);
