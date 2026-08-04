// Measures the vertical content bands (icon / wordmark / studio+lines) and
// the bounding box of the silver "P" glyph inside the icon, from the
// transparent logo asset. Re-run this if /brand/pirilight-logo.png is ever
// replaced, and update the fractions in src/lib/logoLayout.ts to match.
import sharp from 'sharp';

const path = 'public/brand/pirilight-logo.png';
const img = sharp(path);
const { width, height } = await img.metadata();
const { data, info } = await img.raw().ensureAlpha().toBuffer({ resolveWithObject: true });
const channels = info.channels;

function at(x, y) {
  const idx = (y * width + x) * channels;
  return [data[idx], data[idx + 1], data[idx + 2], data[idx + 3]];
}

const bg = at(2, 2);
function isContent(r, g, b, a) {
  if (a < 10) return false;
  return Math.abs(r - bg[0]) + Math.abs(g - bg[1]) + Math.abs(b - bg[2]) > 20;
}

const rowDensity = new Array(height).fill(0);
for (let y = 0; y < height; y++) {
  let count = 0;
  for (let x = 0; x < width; x += 2) {
    const [r, g, b, a] = at(x, y);
    if (isContent(r, g, b, a)) count++;
  }
  rowDensity[y] = count / (width / 2);
}

const THRESH = 0.01;
const bands = [];
let inBand = false;
let bandStart = 0;
for (let y = 0; y < height; y++) {
  if (rowDensity[y] > THRESH && !inBand) {
    inBand = true;
    bandStart = y;
  }
  if (rowDensity[y] <= THRESH && inBand) {
    inBand = false;
    bands.push([bandStart, y - 1]);
  }
}
if (inBand) bands.push([bandStart, height - 1]);

console.log('image size', width, height);
console.log('bands (y ranges):');
for (const [a1, b1] of bands) {
  console.log(`  y ${a1}-${b1} (frac ${(a1 / height).toFixed(3)}-${(b1 / height).toFixed(3)}), height ${b1 - a1}`);
}

const [iconTop, iconBottom] = bands[0];
let pMinX = width;
let pMaxX = 0;
let pMinY = height;
let pMaxY = 0;
for (let y = iconTop; y <= iconBottom; y++) {
  for (let x = 0; x < width; x++) {
    const [r, g, b, a] = at(x, y);
    if (!isContent(r, g, b, a)) continue;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const sat = max === 0 ? 0 : (max - min) / max;
    const lum = (r + g + b) / 3;
    // Silver/white letterform: low-to-moderate saturation, decent brightness.
    // Excludes the saturated blue leaf accent and glow.
    if (sat < 0.25 && lum > 40) {
      if (x < pMinX) pMinX = x;
      if (x > pMaxX) pMaxX = x;
      if (y < pMinY) pMinY = y;
      if (y > pMaxY) pMaxY = y;
    }
  }
}

console.log('silver P glyph bbox (px):', { pMinX, pMaxX, pMinY, pMaxY });
console.log('silver P glyph bbox (frac):', {
  xMin: (pMinX / width).toFixed(4),
  xMax: (pMaxX / width).toFixed(4),
  yMin: (pMinY / height).toFixed(4),
  yMax: (pMaxY / height).toFixed(4),
  cx: ((pMinX + pMaxX) / 2 / width).toFixed(4),
  cy: ((pMinY + pMaxY) / 2 / height).toFixed(4),
});
