import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read('public/models/piri.optimized.glb');
const root = doc.getRoot();

// Mesh_0 is the main body (per earlier inspection: body+wings share Material_0,
// body mesh itself is "Mesh_0", wings are Mesh_0.001/.002).
const bodyMesh = root.listMeshes().find((m) => m.getName() === 'Mesh_0');
const prim = bodyMesh.listPrimitives()[0];
const pos = prim.getAttribute('POSITION');
const count = pos.getCount();

// Rear of the body = most negative Z (nose/chest is +Z per NOSE_CORRECTION
// and the chest-glow plane at z=+0.8). Find the rearmost vertices, then the
// lowest (most negative Y) among them, as a proxy for "lowest point of the
// glowing tail."
let minZ = Infinity;
for (let i = 0; i < count; i++) {
  const p = pos.getElement(i, []);
  if (p[2] < minZ) minZ = p[2];
}
console.log('rearmost Z:', minZ.toFixed(3));

const REAR_BAND = minZ + 0.25; // vertices within 0.25 of the very back
let minY = Infinity, minYPt = null;
let sumX = 0, sumY = 0, sumZ = 0, n = 0;
for (let i = 0; i < count; i++) {
  const p = pos.getElement(i, []);
  if (p[2] <= REAR_BAND) {
    n++;
    sumX += p[0]; sumY += p[1]; sumZ += p[2];
    if (p[1] < minY) { minY = p[1]; minYPt = p.slice(); }
  }
}
console.log('rear-band vertex count:', n);
console.log('rear-band centroid:', [sumX/n, sumY/n, sumZ/n].map(v=>v.toFixed(3)));
console.log('lowest point in rear band:', minYPt.map(v=>v.toFixed(3)));
