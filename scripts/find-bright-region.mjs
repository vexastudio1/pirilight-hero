import sharp from 'sharp';

const path = process.argv[2];
const img = sharp(path);
const { width, height } = await img.metadata();
const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
const channels = info.channels;

let minX = width, minY = height, maxX = 0, maxY = 0;
let count = 0;
const THRESH = 210;

for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const idx = (y * width + x) * channels;
    const r = data[idx], g = data[idx + 1], b = data[idx + 2];
    const lum = (r + g + b) / 3;
    if (lum > THRESH) {
      count++;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
}

console.log({ width, height, channels, brightPixelCount: count, bbox: { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY } });
