// AF4AI model core: primitives + facade helpers + writers (GLB, phase-tagged hero GLB, SketchUp Ruby, prims.json).
// A project file builds groups with grp()/box()/cyl()/sph()/inst()/comp(), then calls writeAll().
import { Document, NodeIO } from '@gltf-transform/core';
import fs from 'fs';
export const HERO = !!process.env.HERO;
let seed = 7; export const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
export const setSeed = s => { seed = s; };
export const G = {}; export const COMP = {}; let cur = 'SITE';
export const grp = n => { cur = n; G[n] ??= []; };
export const box = (x0, y0, z0, x1, y1, z1, m, rot) => G[cur].push({ t: 'box', a: [Math.min(x0, x1), Math.min(y0, y1), Math.min(z0, z1)], b: [Math.max(x0, x1), Math.max(y0, y1), Math.max(z0, z1)], m, rot });
export const cyl = (x, y, z, r, h, m, seg = 16) => G[cur].push({ t: 'cyl', c: [x, y, z], r, h, m, seg });
export const sph = (x, y, z, r, m) => G[cur].push({ t: 'sph', c: [x, y, z], r, m });
export const inst = (comp, x, y, z, ry = 0) => G[cur].push({ t: 'inst', comp, p: [x, y, z], ry });
export const comp = (name, fn) => { const save = cur; grp('C_' + name); fn(); COMP[name] = G['C_' + name]; delete G['C_' + name]; cur = save; };
export const OPT = { frame: 'bronze', glass: 'glass', mull: 1.4, rail: 'bronze' };

// wall in a plane with rectangular openings. axis 'z': wall at z=[w0,w1], spans x. axis 'x': wall at x=[w0,w1], spans z.
export function wall(axis, w0, w1, u0, u1, y0, y1, openings, m = 'plaster', win = true) {
  const seg = (a0, a1, b0, b1) => axis === 'z' ? box(a0, b0, w0, a1, b1, w1, m) : box(w0, b0, a0, w1, b1, a1, m);
  const os = openings.slice().sort((p, q) => p[0] - q[0]);
  let u = u0;
  for (const [o0, o1, ya, yb] of os) {
    if (o0 > u) seg(u, o0, y0, y1);
    if (ya > y0) seg(o0, o1, y0, ya);
    if (yb < y1) seg(o0, o1, yb, y1);
    if (win) window_(axis, w0, w1, o0, o1, ya, yb);
    u = o1;
  }
  if (u < u1) seg(u, u1, y0, y1);
}
export function window_(axis, w0, w1, o0, o1, ya, yb, mull = OPT.mull) {
  const f = .06, mid = (w0 + w1) / 2, F = OPT.frame;
  const B = (a0, a1, b0, b1, c0, c1, m) => axis === 'z' ? box(a0, b0, c0, a1, b1, c1, m) : box(c0, b0, a0, c1, b1, a1, m);
  B(o0, o1, ya, ya + f, w0, w1, F); B(o0, o1, yb - f, yb, w0, w1, F);
  B(o0, o0 + f, ya, yb, w0, w1, F); B(o1 - f, o1, ya, yb, w0, w1, F);
  const n = Math.max(1, Math.round((o1 - o0) / mull));
  for (let i = 1; i < n; i++) { const u = o0 + (o1 - o0) * i / n; B(u - f / 2, u + f / 2, ya, yb, mid - .03, mid + .03, F); }
  B(o0 + f, o1 - f, ya + f, yb - f, mid - .01, mid + .01, OPT.glass);
}
export function rail(axis, w, u0, u1, y, m = 'glass', h = 1.1) {
  const R = OPT.rail;
  if (axis === 'z') { box(u0, y, w - .02, u1, y + h - .05, w + .02, m); box(u0, y + h - .05, w - .04, u1, y + h, w + .04, R); }
  else { box(w - .02, y, u0, w + .02, y + h - .05, u1, m); box(w - .04, y + h - .05, u0, w + .04, y + h, u1, R); }
}
// planter blobs along x (axis 'z') or along z (axis 'x'); hang = cascading chains toward +normal
export function plants(axis, u0, u1, w0, w1, y, dens, hang, dir = 1, mats = ['plant', 'plant2']) {
  const P = (u, yy, w, r, m) => axis === 'z' ? sph(u, yy, w, r, m) : sph(w, yy, u, r, m);
  for (let u = u0 + .2; u < u1 - .15; u += .3 + rnd() * .3) {
    if (rnd() > dens) continue;
    const s = .22 + rnd() * .28, m = mats[Math.floor(rnd() * mats.length)];
    P(u, y + s * .6, (w0 + w1) / 2 + (rnd() - .5) * .2, s, m);
    if (rnd() < .5) P(u + (rnd() - .5) * .3, y + s * 1.2, (w0 + w1) / 2, s * .7, m);
    if (hang && rnd() < .5) {
      let r = .2 + rnd() * .1, yy = y - .1, ww = (dir > 0 ? w1 : w0) + .12 * dir, uu = u; const n = 2 + Math.floor(rnd() * 5);
      for (let k = 0; k < n; k++) { P(uu, yy, ww, r, m); yy -= r * 1.3; ww += .03 * dir; uu += (rnd() - .5) * .15; r *= .85; }
    }
  }
}

// ---------------- writers ----------------
export async function writeAll({ name, title, MATS, typ = null, phase, out = 'out' }) {
  fs.mkdirSync(out, { recursive: true });
  const doc = new Document(); const buf = doc.createBuffer(); const scene = doc.createScene(title);
  const mat = {};
  const hex = h => [1, 3, 5].map(i => Math.pow(parseInt(h.slice(i, i + 2), 16) / 255, 2.2));
  for (const [k, v] of Object.entries(MATS)) {
    const m = doc.createMaterial(k).setBaseColorFactor([...hex(v.c), v.a ?? 1]).setRoughnessFactor(v.r).setMetallicFactor(v.m ?? 0);
    if (v.e) m.setEmissiveFactor(hex(v.e));
    if (v.a) m.setAlphaMode('BLEND'); mat[k] = m;
  }
function geomOf(items) {
    const by = {};
    const push = (m, P3, N3, I) => { const g = by[m] ??= { p: [], n: [], i: [] }; const o = g.p.length / 3; g.p.push(...P3); g.n.push(...N3); g.i.push(...I.map(i => i + o)); };
    for (const it of items) {
      if (it.t === 'box') {
        const [x0, y0, z0] = it.a, [x1, y1, z1] = it.b;
        const F = [[[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1], [1, 0, 0]], [[x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [x0, y0, z0], [-1, 0, 0]],
        [[x0, y1, z0], [x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [0, 1, 0]], [[x0, y0, z1], [x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [0, -1, 0]],
        [[x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [x0, y0, z1], [0, 0, 1]], [[x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [x1, y0, z0], [0, 0, -1]]];
        let P3 = [], N3 = [], I = [];
        F.forEach((f, k) => { for (let j = 0; j < 4; j++) { P3.push(...f[j]); N3.push(...f[4]); } I.push(k * 4, k * 4 + 1, k * 4 + 2, k * 4, k * 4 + 2, k * 4 + 3); });
        if (it.rot) { // rotate about the box centre around x axis
          const c = [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2], s = Math.sin(it.rot.ang), co = Math.cos(it.rot.ang);
          const R = (a, i, t) => { const y = a[i + 1] - (t ? c[1] : 0), z = a[i + 2] - (t ? c[2] : 0); a[i + 1] = y * co - z * s + (t ? c[1] : 0); a[i + 2] = y * s + z * co + (t ? c[2] : 0); };
          for (let i = 0; i < P3.length; i += 3) { R(P3, i, true); R(N3, i, false); }
        }
        push(it.m, P3, N3, I);
      } else if (it.t === 'cyl') {
        const [cx, cy0, cz] = it.c, P3 = [], N3 = [], I = [], n = it.seg;
        for (let i = 0; i <= n; i++) { const a = i / n * Math.PI * 2, x = Math.cos(a), z = Math.sin(a); P3.push(cx + x * it.r, cy0, cz + z * it.r, cx + x * it.r, cy0 + it.h, cz + z * it.r); N3.push(x, 0, z, x, 0, z); }
        for (let i = 0; i < n; i++) { const a = i * 2; I.push(a, a + 3, a + 1, a, a + 2, a + 3); }
        const top = P3.length / 3; P3.push(cx, cy0 + it.h, cz); N3.push(0, 1, 0);
        for (let i = 0; i <= n; i++) { const a = i / n * Math.PI * 2; P3.push(cx + Math.cos(a) * it.r, cy0 + it.h, cz + Math.sin(a) * it.r); N3.push(0, 1, 0); }
        for (let i = 0; i < n; i++) I.push(top, top + 2 + i, top + 1 + i);
        push(it.m, P3, N3, I);
      } else if (it.t === 'sph') {
        const P3 = [], N3 = [], I = [], ns = 7, nr = 10, [cx, cy, cz] = it.c;
        for (let i = 0; i <= ns; i++) for (let j = 0; j <= nr; j++) { const th = i / ns * Math.PI, ph = j / nr * Math.PI * 2; const x = Math.sin(th) * Math.cos(ph), y = Math.cos(th), z = Math.sin(th) * Math.sin(ph); P3.push(cx + x * it.r, cy + y * it.r * .85, cz + z * it.r); N3.push(x, y, z); }
        for (let i = 0; i < ns; i++) for (let j = 0; j < nr; j++) { const a = i * (nr + 1) + j, b = a + nr + 1; I.push(a, a + 1, b, a + 1, b + 1, b); }
        push(it.m, P3, N3, I);
      }
    }
    return by;
  }
  
  const PHM = {};
  const matFor = (group, m) => {
    if (!HERO) return mat[m];
    const ph = phase(group, m), key = ph + '|' + (/glass/i.test(m) ? 'Glass_' + m : m);
    return PHM[key] ??= mat[m].clone().setName(key);
  };
  const meshOf = (nm, items, grpName) => {
    const by = geomOf(items), mesh = doc.createMesh(nm);
    for (const [m, g] of Object.entries(by)) {
      mesh.addPrimitive(doc.createPrimitive().setMaterial(matFor(grpName, m))
        .setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(new Float32Array(g.p)).setBuffer(buf))
        .setAttribute('NORMAL', doc.createAccessor().setType('VEC3').setArray(new Float32Array(g.n)).setBuffer(buf))
        .setIndices(doc.createAccessor().setType('SCALAR').setArray(new Uint32Array(g.i)).setBuffer(buf)));
    }
    return mesh;
  };
  const compMesh = {}; for (const [k, v] of Object.entries(COMP)) compMesh[k] = meshOf(k, v, k);
  const typMesh = typ ? meshOf('TypicalFloor', G[typ.group], typ.group) : null;
  for (const [nm, items] of Object.entries(G)) {
    if (typ && nm === typ.group) continue;
    const node = doc.createNode(nm); scene.addChild(node);
    const plain = items.filter(i => i.t !== 'inst'); if (plain.length) node.setMesh(meshOf(nm, plain, nm));
    items.filter(i => i.t === 'inst').forEach((it, j) => node.addChild(doc.createNode(`${nm}_${it.comp}_${j}`).setMesh(compMesh[it.comp]).setTranslation(it.p).setRotation([0, Math.sin(it.ry / 2), 0, Math.cos(it.ry / 2)])));
  }
  if (typ) for (let k = 1; k <= typ.N; k++) scene.addChild(doc.createNode('F' + String(k).padStart(2, '0')).setMesh(typMesh).setTranslation([0, typ.base + (k - 1) * typ.step, 0]));
  await new NodeIO().write(`${out}/${name}${HERO ? '-hero-raw' : ''}.glb`, doc);
  if (HERO) { console.log('hero glb written'); return; }

  // SketchUp Ruby: three (x,y,z) -> SketchUp (x, -z, y)
  const f = v => (+v.toFixed(3)).toString();
  const rb = [];
  rb.push(`# ${title} (AF4AI) - generated model. Paste into Extensions > Developer > Ruby Console and press Enter.
model = Sketchup.active_model
model.start_operation('AF4AI ${title}', true)
ents = model.active_entities
M = {}
def mk(model, name, hex, alpha)
  m = model.materials[name] || model.materials.add(name)
  m.color = Sketchup::Color.new(hex); m.alpha = alpha; m
end`);
  const pre = title.replace(/[^A-Za-z0-9]+/g, '');
  for (const [k, v] of Object.entries(MATS)) rb.push(`M['${k}'] = mk(model, '${pre}_${k}', '${v.c}', ${v.a ?? 1.0})`);
  rb.push(`
def bx(e, x0, y0, z0, x1, y1, z1, m, rot = nil)
  g = e.add_group
  f = g.entities.add_face([x0.m, y0.m, z0.m], [x1.m, y0.m, z0.m], [x1.m, y1.m, z0.m], [x0.m, y1.m, z0.m])
  f.reverse! if f.normal.z < 0
  f.pushpull((z1 - z0).m)
  if rot
    c = Geom::Point3d.new(((x0 + x1) / 2).m, ((y0 + y1) / 2).m, ((z0 + z1) / 2).m)
    g.transform!(Geom::Transformation.rotation(c, X_AXIS, rot))
  end
  g.material = M[m]; g
end
def cy(e, x, y, z, r, h, m, seg)
  g = e.add_group
  f = g.entities.add_face(g.entities.add_circle([x.m, y.m, z.m], Z_AXIS, r.m, seg))
  f.reverse! if f.normal.z < 0
  f.pushpull(h.m); g.material = M[m]; g
end
def sp(e, x, y, z, r, m)
  g = e.add_group
  f = g.entities.add_face(g.entities.add_circle([x.m, y.m, z.m], X_AXIS, r.m, 12))
  path = g.entities.add_circle([x.m, y.m, z.m], Z_AXIS, (r * 1.02).m, 12)
  f.followme(path); g.material = M[m]
  g.transform!(Geom::Transformation.scaling(Geom::Point3d.new(x.m, y.m, z.m), 1, 1, 0.85)); g
end`);
  const emit = (e, it) => {
    if (it.t === 'box') { const [x0, y0, z0] = it.a, [x1, y1, z1] = it.b; return `bx(${e},${f(x0)},${f(-z1)},${f(y0)},${f(x1)},${f(-z0)},${f(y1)},'${it.m}'${it.rot ? ',' + f(it.rot.ang) : ''})`; }
    if (it.t === 'cyl') return `cy(${e},${f(it.c[0])},${f(-it.c[2])},${f(it.c[1])},${f(it.r)},${f(it.h)},'${it.m}',${it.seg})`;
    if (it.t === 'sph') return `sp(${e},${f(it.c[0])},${f(-it.c[2])},${f(it.c[1])},${f(it.r)},'${it.m}')`;
    return null;
  };
  for (const [k, v] of Object.entries(COMP)) { rb.push(`\nD_${k} = model.definitions.add('AF4AI ${k}')\nde = D_${k}.entities`); v.forEach(it => rb.push(emit('de', it))); }
  if (typ) { rb.push(`\nD_typ = model.definitions.add('${title} Typical Floor')\nde = D_typ.entities`); G[typ.group].forEach(it => rb.push(emit('de', it))); }
  for (const [nm, items] of Object.entries(G)) {
    if (typ && nm === typ.group) continue;
    rb.push(`\ngp = ents.add_group; gp.name = '${nm}'; ge = gp.entities`);
    for (const it of items) {
      if (it.t === 'inst') rb.push(`ge.add_instance(D_${it.comp}, Geom::Transformation.new([${f(it.p[0])}.m,${f(-it.p[2])}.m,${f(it.p[1])}.m]) * Geom::Transformation.rotation(ORIGIN, Z_AXIS, ${f(it.ry)}))`);
      else rb.push(emit('ge', it));
    }
  }
  if (typ) { rb.push(`\nfl = ents.add_group; fl.name = 'FLOORS'`); for (let k = 1; k <= typ.N; k++) rb.push(`i = fl.entities.add_instance(D_typ, Geom::Transformation.new([0, 0, ${f(typ.base + (k - 1) * typ.step)}.m])); i.name = 'F${String(k).padStart(2, '0')}'`); }
  rb.push(`\nmodel.commit_operation\nmodel.active_view.zoom_extents\nputs 'AF4AI ${title} built.'`);
  fs.writeFileSync(`${out}/${name}_sketchup.rb`, rb.join('\n'));
  fs.writeFileSync(`${out}/prims.json`, JSON.stringify({ typ, G }));
  const cnt = Object.values(G).reduce((s, v) => s + v.length, 0);
  console.log('items', cnt, 'rb lines', rb.length, 'glb', fs.statSync(`${out}/${name}.glb`).size);
}
