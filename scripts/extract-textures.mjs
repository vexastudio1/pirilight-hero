import fs from 'node:fs';

const glbPath = process.argv[2];
const outDir = process.argv[3];

const buf = fs.readFileSync(glbPath);
let offset = 12;
let json = null;
let binStart = 0;

while (offset < buf.length) {
  const len = buf.readUInt32LE(offset);
  const type = buf.toString('utf8', offset + 4, offset + 8);
  if (type === 'JSON') json = JSON.parse(buf.slice(offset + 8, offset + 8 + len).toString('utf8'));
  else if (type === 'BIN\0') binStart = offset + 8;
  offset += 8 + len;
}

json.images.forEach((img, i) => {
  const bv = json.bufferViews[img.bufferView];
  const start = binStart + (bv.byteOffset || 0);
  const data = buf.slice(start, start + bv.byteLength);
  const outPath = `${outDir}/tmp_img_${i}.jpg`;
  fs.writeFileSync(outPath, data);
  console.log('wrote', outPath, data.length);
});
