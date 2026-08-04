import sharp from 'sharp';

const path = 'public/brand/pirilight-logo.png';
const img = sharp(path);
const { width, height } = await img.metadata();
const { data, info } = await img.raw().ensureAlpha().toBuffer({ resolveWithObject: true });
const channels = info.channels;

function isContent(x, y) {
  const idx = (y * width + x) * channels;
  return data[idx + 3] > 10;
}

const BANDS = {
  icon: { top: 0.169, bottom: 0.594 },
  wordmark: { top: 0.652, bottom: 0.72 },
  studio: { top: 0.756, bottom: 0.78 },
};

for (const [name, { top, bottom }] of Object.entries(BANDS)) {
  const yTop = Math.round(top * height);
  const yBottom = Math.round(bottom * height);
  let minX = width, maxX = 0;
  for (let y = yTop; y <= yBottom; y++) {
    for (let x = 0; x < width; x++) {
      if (isContent(x, y)) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
      }
    }
  }
  console.log(name, {
    minXFrac: (minX / width).toFixed(4),
    maxXFrac: (maxX / width).toFixed(4),
    widthFrac: ((maxX - minX) / width).toFixed(4),
    centerFrac: ((minX + maxX) / 2 / width).toFixed(4),
  });
}
