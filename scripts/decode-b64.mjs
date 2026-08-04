import fs from 'node:fs';
const [, , inPath, outPath] = process.argv;
const b64 = fs.readFileSync(inPath, 'utf8').trim();
fs.writeFileSync(outPath, Buffer.from(b64, 'base64'));
console.log('wrote', outPath);
