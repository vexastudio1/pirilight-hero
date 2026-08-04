import sharp from 'sharp';

const path = process.argv[2];
const img = sharp(path);
const meta = await img.metadata();
const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
const { width, height, channels } = info;

// corner background color
const bg = [data[0], data[1], data[2]];
console.log('size', width, height);
console.log('corner bg color', bg, '#' + bg.map((v) => v.toString(16).padStart(2, '0')).join(''));

// find bounding box of pixels that differ meaningfully from bg
const THRESH = 18;
let minX = width, minY = height, maxX = 0, maxY = 0;
for (let y = 0; y < height; y += 2) {
  for (let x = 0; x < width; x += 2) {
    const idx = (y * width + x) * channels;
    const dr = Math.abs(data[idx] - bg[0]);
    const dg = Math.abs(data[idx + 1] - bg[1]);
    const db = Math.abs(data[idx + 2] - bg[2]);
    if (dr + dg + db > THRESH) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
}
console.log('content bbox', { minX, minY, maxX, maxY });
console.log('content bbox fractions', {
  minXf: (minX / width).toFixed(3),
  maxXf: (maxX / width).toFixed(3),
  minYf: (minY / height).toFixed(3),
  maxYf: (maxY / height).toFixed(3),
});
