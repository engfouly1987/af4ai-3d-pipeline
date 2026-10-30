// Sharaa Resort: landscape pass over the Codex v3 model, to move it toward the final renders (EXT-01, EXT-05, LIFE shots).
// Codex axes: sea to -Z (shore ~ z -131), coastal road at +Z (~170), compound x -213..225, z -30..158.
import { grp, box, cyl, sph, inst, comp, rnd, writeAll } from '../../../kit/lib/af4ai-model.mjs';

const MATS = {
  lawn:   { c: '#5C8240', r: .95 },
  lawn2:  { c: '#688F48', r: .95 },
  hedge:  { c: '#4E7438', r: .95 },
  crown:  { c: '#56783C', r: .9 },
  crown2: { c: '#6B8B45', r: .9 },
  frond:  { c: '#5E8040', r: .9 },
  trunk:  { c: '#7A6048', r: .95 },
  bougain:{ c: '#B83A70', r: .85 },
  hull:   { c: '#F4F4F1', r: .4 },
  deck:   { c: '#A88660', r: .7 },
  navy:   { c: '#2E3B4E', r: .5 },
  glass:  { c: '#2E3A3F', r: .1, m: .2, a: .6 },
  domeW:  { c: '#F6F4EF', r: .6 },
  desert: { c: '#D9C29A', r: 1 },
  seaDeep:{ c: '#1D6C77', r: .25, m: .1 },
  asph:   { c: '#5A5856', r: 1 },
  thatch: { c: '#B08B57', r: .95 },
  canvas: { c: '#F1EADB', r: .9 },
  agave:  { c: '#7E9A80', r: .9 },
};
const Y = .118;
const VILLAS = [[-199,-10,-171,17],[-199,32,-171,59],[-199,74,-171,101],[-199,116,-171,143],[-159,-10,-131,17],[-159,32,-131,59],[-159,74,-131,101],[-159,116,-131,143],[-119,-10,-91,17],[-119,32,-91,59],[-119,74,-91,101],[98,-10,126,17],[98,35,126,62],[98,80,126,107],[141,-10,169,17],[183,-10,211,17],[183,35,211,62],[183,80,211,107]];

// ---- context: desert inland, coastal highway, open sea (for the long aerial like the Veo shot) ----
grp('DESERT');
box(-2500, -.45, 181, 2500, -.32, 3500, 'desert'); box(-2500, -.45, -138, -260, -.32, 181, 'desert'); box(260, -.45, -138, 2500, -.32, 181, 'desert');
box(-2500, -.3, 205, 2500, -.28, 222, 'asph');
box(-2500, -.6, -2500, 2500, -.35, -284, 'seaDeep'); box(-2500, -.6, -284, -260, -.35, -131, 'seaDeep'); box(260, -.6, -284, 2500, -.35, -131, 'seaDeep');
// ---- lawns: villa clusters, spa garden, front garden strip ----
grp('LAWNS');
box(-210, .1, -24, -82, Y, 153, 'lawn');
box(84, .1, -24, 222, Y, 116, 'lawn');
box(-82, .1, -36, 82, Y, -28, 'lawn2');
box(-80, .1, -12, -76, Y, 84, 'lawn2'); box(76, .1, -12, 80, Y, 84, 'lawn2');
box(-210, .1, -36, -82, Y, -24, 'lawn2'); box(84, .1, -36, 222, Y, -24, 'lawn2');

// ---- hedges around each villa plot (with a gate gap toward the street) ----
grp('HEDGES');
for (const [x0, z0, x1, z1] of VILLAS) {
  const o = 2.2, a = x0 - o, b = x1 + o, c = z0 - o, d = z1 + o, h = 1.1, t = .9, g = (a + b) / 2;
  box(a, Y, c, g - 2, Y + h, c + t, 'hedge'); box(g + 2, Y, c, b, Y + h, c + t, 'hedge');
  box(a, Y, d - t, b, Y + h, d, 'hedge');
  box(a, Y, c, a + t, Y + h, d, 'hedge'); box(b - t, Y, c, b, Y + h, d, 'hedge');
  for (let i = 0; i < 4; i++) sph(a + rnd() * (b - a), Y + 1.4, d - .5, .8 + rnd() * .5, rnd() > .6 ? 'bougain' : 'hedge');
}
// perimeter green belt (rear and both sides), as in the final aerial
box(-213, Y, 155.5, 225, Y + 2.2, 158.5, 'hedge');
box(-216, Y, -30, -213, Y + 2.2, 158.5, 'hedge'); box(225, Y, -30, 228, Y + 2.2, 158.5, 'hedge');

// ---- trees ----
grp('TREES');
for (let x = -208; x <= 222; x += 5.5) inst(rnd() > .5 ? 'treeA' : 'treeB', x + rnd() * 1.5, Y, 153 + rnd() * 1.5, rnd() * 6);
for (let z = -26; z <= 150; z += 5.5) { inst(rnd() > .5 ? 'treeA' : 'treeB', -209 + rnd(), Y, z, rnd() * 6); inst(rnd() > .5 ? 'treeA' : 'treeB', 221 + rnd(), Y, z, rnd() * 6); }
// palms lining the villa streets and the front garden
for (const x of [-165, -125, 134, 177]) for (let z = -6; z <= 148; z += 13) if (!(x > 0 && z > 112)) inst('palm', x + (rnd() - .5) * 2, Y, z, rnd() * 6);
for (let x = -78; x <= 78; x += 9) if (Math.abs(x) > 46) inst('palm', x, Y, -32, rnd() * 6);
for (const x of [-48, -28, -9, 9, 28, 48]) inst('palm', x, Y, -33, rnd() * 6);

// scattered garden trees and palms across the villa lawns (dense like the final aerial)
const inVilla = (x, z) => VILLAS.some(([a, c, b, d]) => x > a - 4 && x < b + 4 && z > c - 4 && z < d + 4);
for (const [x0, z0, x1, z1, n] of [[-206, -22, -84, 150, 240], [86, -22, 218, 114, 190]]) {
  let k = 0, guard = 0;
  while (k < n && guard++ < 5000) { const x = x0 + rnd() * (x1 - x0), z = z0 + rnd() * (z1 - z0); if (inVilla(x, z)) continue; inst(rnd() < .45 ? 'palm' : (rnd() > .5 ? 'treeA' : 'treeB'), x, Y, z, rnd() * 6); k++; }
}
// palms around the lagoon deck and plaza edges
for (let z = -20; z <= 62; z += 8) { inst('palm', -47, Y, z, rnd() * 6); inst('palm', 47, Y, z, rnd() * 6); }
// ---- lagoon deck life (EXT-03): umbrellas + loungers, thatched swim-up bar, green strips along the wings ----
grp('LAGOON_LIFE');
for (const sx of [-1, 1]) {
  box(sx * 44.5, .1, -22, sx * 49.5, .55, 62, 'lawn2');
  for (let z = -18; z <= 58; z += 6) { sph(sx * 47, .9, z, .9, z % 12 ? 'agave' : 'hedge'); }
  for (let z = -16; z <= 56; z += 9) { cyl(sx * 40.5, .5, z, .05, 2.4, 'trunk', 6); cyl(sx * 40.5, 2.6, z, 1.5, .12, 'canvas', 14); box(sx * 38.6 - .35, .5, z - 1.2, sx * 38.6 + .35, .8, z + 1.2, 'deck'); box(sx * 42.4 - .35, .5, z - 1.2, sx * 42.4 + .35, .8, z + 1.2, 'deck'); }
}
for (let i = 0; i < 8; i++) cyl(22 + Math.cos(i / 8 * 6.283) * 3, .5, 10 + Math.sin(i / 8 * 6.283) * 3, .12, 2.6, 'trunk', 6);
[[4.2, 2.7], [3.4, 3.05], [2.6, 3.4], [1.8, 3.75], [1.0, 4.1], [.4, 4.4]].forEach(([r, y]) => cyl(22, y, 10, r, .38, 'thatch', 18)); cyl(22, .5, 10, 2.2, 1.1, 'deck', 16);
// ---- white domes on the hotel wing ends (EXT-03) ----
grp('WING_DOMES');
for (const [x, z, r] of [[-62, -5, 3.4], [62, -5, 3.4], [-62, 74, 2.6], [62, 74, 2.6], [-62, 34, 2.2], [62, 34, 2.2]]) { cyl(x, 15.5, z, r * .92, 1.3, 'domeW', 20); sph(x, 16.8, z, r, 'domeW'); }
// ---- boats on the Mediterranean ----
grp('BOATS');
for (const [x, z, r, k] of [[-150, -150, .4, 'boat'], [-95, -158, -.3, 'boat'], [-55, -146, .9, 'boat'], [-20, -155, 1.2, 'boat'], [30, -152, .2, 'yacht'], [60, -162, -.4, 'yacht'], [95, -148, -.6, 'boat'], [130, -158, .5, 'boat'], [175, -150, .1, 'boat']]) inst(k, x, -.15, z, r);

comp('treeA', () => { cyl(0, 0, 0, .18, 2.6, 'trunk', 8); sph(0, 3.8, 0, 2.0, 'crown'); sph(.8, 3.2, .4, 1.4, 'crown'); });
comp('treeB', () => { cyl(0, 0, 0, .16, 2.2, 'trunk', 8); sph(0, 3.3, 0, 1.6, 'crown2'); sph(-.6, 2.8, -.3, 1.1, 'crown2'); });
comp('palm', () => {
  cyl(0, 0, 0, .2, 6.5, 'trunk', 8);
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; for (let k = 1; k <= 3; k++) sph(Math.cos(a) * k * .9, 6.6 - k * k * .12, Math.sin(a) * k * .9, .55 - k * .08, 'frond'); }
  sph(0, 6.7, 0, .6, 'frond');
});
comp('boat', () => { box(-3, 0, -1, 3, .9, 1, 'hull'); box(-1.2, .9, -.7, 1.4, 1.6, .7, 'hull'); box(-1.1, 1.0, -.72, 1.3, 1.45, .72, 'glass'); box(1.8, .9, -.8, 2.9, 1.0, .8, 'deck'); });
comp('yacht', () => { box(-8, 0, -2, 8, 1.6, 2, 'hull'); box(-4, 1.6, -1.6, 4, 3.2, 1.6, 'hull'); box(-3.8, 2.0, -1.62, 3.8, 2.9, 1.62, 'glass'); box(-2, 3.2, -1.2, 2, 4.3, 1.2, 'hull'); box(-1.9, 3.5, -1.22, 1.9, 4.1, 1.22, 'glass'); box(5, 1.6, -1.6, 7.6, 1.7, 1.6, 'deck'); });

await writeAll({ name: 'sharaa-add', title: 'Sharaa Landscape', MATS, phase: () => 'L', out: new URL('./out', import.meta.url).pathname });
