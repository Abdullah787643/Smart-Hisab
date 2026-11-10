import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

const publicDir = path.resolve(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. High-quality SVG icon for Smart Hisab
const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#059669" />
      <stop offset="100%" stop-color="#047857" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="16" stdDeviation="20" flood-color="#000000" flood-opacity="0.25"/>
    </filter>
  </defs>
  <!-- Background with rounded squircles -->
  <rect width="512" height="512" rx="128" fill="url(#grad)" />
  <!-- Wallet / Ledger Outline & Card Slot -->
  <g filter="url(#shadow)" fill="none" stroke="#ffffff" stroke-width="28" stroke-linecap="round" stroke-linejoin="round">
    <rect x="96" y="140" width="320" height="232" rx="36" />
    <path d="M96 220 H 416" />
    <path d="M290 286 H 350" />
    <circle cx="350" cy="286" r="14" fill="#ffffff" stroke="none" />
    <!-- Bengali / Rupee / Currency Accent -->
    <path d="M190 260 V 312" stroke-width="24" />
    <path d="M168 280 H 212" stroke-width="24" />
  </g>
</svg>`;

fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgIcon, 'utf-8');
console.log('Saved public/icon.svg');

// 2. Pure Node helper to generate valid uncompressed/DEFLATE PNG image
function createPngBuffer(width, height, r, g, b) {
  // Simple solid color PNG with emerald background and center white badge
  const rowSize = width * 4 + 1;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      
      // Distance from center
      const dx = x - width / 2;
      const dy = y - height / 2;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const radius = width * 0.44;

      // Squircle/rounded badge test
      const isCorner = Math.abs(dx) > width * 0.38 && Math.abs(dy) > height * 0.38 && dist > width * 0.48;
      
      // Center icon symbol area (simplified wallet shape)
      const isSymbol = Math.abs(dx) < width * 0.22 && Math.abs(dy) < height * 0.16 && (
        Math.abs(dy) > height * 0.13 || Math.abs(dx) > width * 0.19 || Math.abs(dy - height * 0.02) < height * 0.02
      );

      if (isCorner) {
        // Transparent corner
        rawData[pixelOffset] = 0;
        rawData[pixelOffset + 1] = 0;
        rawData[pixelOffset + 2] = 0;
        rawData[pixelOffset + 3] = 0;
      } else if (isSymbol) {
        // White symbol
        rawData[pixelOffset] = 255;
        rawData[pixelOffset + 1] = 255;
        rawData[pixelOffset + 2] = 255;
        rawData[pixelOffset + 3] = 255;
      } else {
        // Emerald primary #059669
        rawData[pixelOffset] = r;
        rawData[pixelOffset + 1] = g;
        rawData[pixelOffset + 2] = b;
        rawData[pixelOffset + 3] = 255;
      }
    }
  }

  const deflated = zlib.deflateSync(rawData);

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth 8
  ihdrData[9] = 6; // color type 6 (RGBA)
  ihdrData[10] = 0; // compression method 0
  ihdrData[11] = 0; // filter method 0
  ihdrData[12] = 0; // interlace method 0
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // IDAT chunk
  const idatChunk = makeChunk('IDAT', deflated);

  // IEND chunk
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function crc32(buf) {
  let table = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c;
  }
  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ (-1)) >>> 0;
}

function makeChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(4 + 4 + len + 4);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const typeAndData = chunk.subarray(4, 8 + len);
  const crc = crc32(typeAndData);
  chunk.writeUInt32BE(crc, 8 + len);
  return chunk;
}

// Generate sizes: 192x192, 512x512, apple-touch-icon 180x180
const pwa192 = createPngBuffer(192, 192, 5, 150, 105);
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), pwa192);

const pwa512 = createPngBuffer(512, 512, 5, 150, 105);
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), pwa512);

const pwaMaskable512 = createPngBuffer(512, 512, 5, 150, 105);
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), pwaMaskable512);

const appleTouchIcon = createPngBuffer(180, 180, 5, 150, 105);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), appleTouchIcon);

fs.writeFileSync(path.join(publicDir, 'favicon.ico'), createPngBuffer(32, 32, 5, 150, 105));

console.log('All PWA icon assets generated successfully in /public!');
