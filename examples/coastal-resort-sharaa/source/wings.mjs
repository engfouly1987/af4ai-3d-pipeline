// Sharaa hotel wings: 3 -> 4 storeys (as in the final aerial EXT-01 and the Veo time-lapse), domes on the wing ends (EXT-03).
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const [inp, out] = process.argv.slice(2);
const doc = await io.read(inp); const scene = doc.getRoot().listScenes()[0];
const FL = 3.6, BASE = .4, TOP0 = 11.6, K = (TOP0 + FL) / TOP0;
let added = 0, scaled = 0;
for (const n of scene.listChildren().slice()) {
  const nm = n.getName();
  if (/^HOTEL_(WEST|EAST|REAR)_ROOM_2_/.test(nm)) {
    const dup = (src) => { const d = doc.createNode(src.getName()).setMesh(src.getMesh()).setTranslation(src.getTranslation()).setRotation(src.getRotation()).setScale(src.getScale()).setExtras({ ...src.getExtras() }); src.listChildren().forEach(ch => d.addChild(dup(ch))); return d; };
    const c = dup(n); c.setName(nm.replace('_ROOM_2_', '_ROOM_3_'));
    const t = c.getTranslation(); c.setTranslation([t[0], t[1] + FL, t[2]]); scene.addChild(c); added++;
  }
  if (/^(HOTEL_WING_-?1_CIRCULATION_ROOF|HOTEL_BROAD_ENDS_AND_SHADED_ROOF_TERRACES|THIRD_HOTEL_RECEPTION_BACKDROP)/.test(nm)) {
    const t = n.getTranslation(), s = n.getScale();
    n.setTranslation([t[0], BASE + (t[1] - BASE) * K, t[2]]).setScale([s[0], s[1] * K, s[2]]); scaled++;
  }
}
await io.write(out, doc);
console.log('room modules added', added, 'shells raised', scaled, 'k', K.toFixed(3));
