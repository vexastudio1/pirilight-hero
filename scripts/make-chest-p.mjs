import sharp from 'sharp';

const size = 512;
const glow = `
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="blur1" x="-100%" y="-100%" width="300%" height="300%">
      <feGaussianBlur stdDeviation="26" />
    </filter>
    <filter id="blur2" x="-100%" y="-100%" width="300%" height="300%">
      <feGaussianBlur stdDeviation="10" />
    </filter>
    <linearGradient id="core" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#f2feff" />
      <stop offset="40%" stop-color="#3ddcff" />
      <stop offset="100%" stop-color="#1878fc" />
    </linearGradient>
  </defs>
  <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle"
        font-family="Arial, sans-serif" font-weight="700" font-size="300"
        fill="#22c7ff" filter="url(#blur1)" opacity="0.6">P</text>
  <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle"
        font-family="Arial, sans-serif" font-weight="700" font-size="300"
        fill="#bdf2ff" filter="url(#blur2)" opacity="0.85">P</text>
  <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle"
        font-family="Arial, sans-serif" font-weight="700" font-size="300"
        fill="url(#core)">P</text>
</svg>
`;

await sharp(Buffer.from(glow)).png().toFile(process.argv[2]);
console.log('wrote', process.argv[2]);
