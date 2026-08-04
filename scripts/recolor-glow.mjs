// Recolors the firefly's baked-in "glow" pixels (wing membrane, tail, chest
// seam, eye) to match the PiriLight logo's blue/cyan palette, and adds a real
// emissive channel so those areas read as lit even in the dark hero
// background. Only pixels that are already blue-biased and reasonably bright
// are touched — dark chitin, metal highlights and normal/roughness maps are
// left untouched.
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS, KHRMaterialsEmissiveStrength } from '@gltf-transform/extensions';
import sharp from 'sharp';

const GLB_PATH = process.argv[2] ?? 'public/models/piri.optimized.glb';

// Logo-sampled palette (see scripts/scan_logo_colors.mjs): deep royal blue
// for the "shadowed" end of the glow, vivid cyan for the "hot" end.
const DEEP = [0, 58, 190]; // ~#003ABE, matches the logo's dominant blue bucket
const HOT = [30, 222, 250]; // ~#1EDEFA, toned down from the logo's peak #01e7fd

function smoothstep(edge0, edge1, x) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

async function main() {
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
  const doc = await io.read(GLB_PATH);
  const material = doc.getRoot().listMaterials()[0];
  const baseTex = material.getBaseColorTexture();
  if (!baseTex) throw new Error('No baseColorTexture found');

  const srcBuffer = Buffer.from(baseTex.getImage());
  const image = sharp(srcBuffer);
  const { width, height } = await image.metadata();
  const { data } = await image.raw().ensureAlpha().toBuffer({ resolveWithObject: true });

  const outColor = Buffer.alloc(data.length);
  const outEmissive = Buffer.alloc(data.length);

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    const avgRG = (r + g) / 2;
    const blueness = b - avgRG;
    const lum = (r + g + b) / 3;

    const w = smoothstep(20, 65, blueness) * smoothstep(55, 115, lum);
    const t = Math.pow(smoothstep(90, 255, lum), 0.85);

    const rampR = lerp(DEEP[0], HOT[0], t);
    const rampG = lerp(DEEP[1], HOT[1], t);
    const rampB = lerp(DEEP[2], HOT[2], t);

    outColor[i] = Math.round(lerp(r, rampR, w));
    outColor[i + 1] = Math.round(lerp(g, rampG, w));
    outColor[i + 2] = Math.round(lerp(b, rampB, w));
    outColor[i + 3] = a;

    outEmissive[i] = Math.round(rampR * w);
    outEmissive[i + 1] = Math.round(rampG * w);
    outEmissive[i + 2] = Math.round(rampB * w);
    outEmissive[i + 3] = 255;
  }

  const newColorWebp = await sharp(outColor, { raw: { width, height, channels: 4 } })
    .webp({ quality: 90 })
    .toBuffer();
  const newEmissiveWebp = await sharp(outEmissive, { raw: { width, height, channels: 4 } })
    .webp({ quality: 82 })
    .toBuffer();

  baseTex.setImage(newColorWebp).setMimeType('image/webp');

  const emissiveTex = doc.createTexture('Image_Emissive').setImage(newEmissiveWebp).setMimeType('image/webp');
  material.setEmissiveTexture(emissiveTex);
  material.setEmissiveFactor([1, 1, 1]);

  const emissiveStrengthExt = doc.createExtension(KHRMaterialsEmissiveStrength);
  const strength = emissiveStrengthExt.createEmissiveStrength().setEmissiveStrength(1.6);
  material.setExtension('KHR_materials_emissive_strength', strength);

  await io.write(GLB_PATH, doc);
  console.log('done ->', GLB_PATH);
}

main();
