import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

const publicDir = path.resolve(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. High-quality SVG icon for Smart Hisab (SVG remains for desktop web tabs)
const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#059669" />
      <stop offset="100%" stop-color="#047857" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="112" fill="url(#grad)" />
  <g fill="none" stroke="#ffffff" stroke-width="26" stroke-linecap="round" stroke-linejoin="round">
    <rect x="96" y="140" width="320" height="232" rx="36" />
    <path d="M96 220 H 416" />
    <path d="M290 286 H 350" />
    <circle cx="350" cy="286" r="14" fill="#ffffff" stroke="none" />
    <path d="M190 260 V 312" stroke-width="24" />
    <path d="M168 280 H 212" stroke-width="24" />
  </g>
</svg>`;

fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgIcon, 'utf-8');
console.log('Saved public/icon.svg');

// 2. Pure Node helper to generate valid, standard-compliant RGBA PNG images
// For maskable & any icons on Android: full-bleed background, crisp white emblem in safe zone (80% circle)
function createPngIcon(width, height, isMaskable = false) {
  const rowSize = width * 4 + 1;
  const rawData = Buffer.alloc(rowSize * height);

  const cx = width / 2;
  const cy = height / 2;
  
  // Safe area sizing: emblem stays well inside 70% of canvas
  const scale = width / 512;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter type 0 (None)

    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;

      // Base background: Primary Emerald (#059669 -> R:5, G:150, B:105)
      // Slight gradient towards bottom right for polished depth
      const gradFactor = 1 - (dy / height) * 0.15;
      let r = Math.max(0, Math.min(255, Math.round(5 * gradFactor)));
      let g = Math.max(0, Math.min(255, Math.round(150 * gradFactor)));
      let b = Math.max(0, Math.min(255, Math.round(105 * gradFactor)));
      let a = 255;

      // Outer squircle corner check for non-maskable icons (maskable MUST be 100% full-bleed opaque!)
      if (!isMaskable) {
        const cornerDist = Math.pow(Math.abs(dx) / (width * 0.48), 5) + Math.pow(Math.abs(dy) / (height * 0.48), 5);
        if (cornerDist > 1) {
          a = 0;
          r = 0;
          g = 0;
          b = 0;
        }
      }

      if (a > 0) {
        // Draw emblem: Wallet body, card strip, latch, and currency symbol inside safe zone
        const ndx = dx / scale;
        const ndy = dy / scale;

        // Wallet outer rect: x in [-160, 160], y in [-116, 116] with rounded corners
        const inWalletBox = Math.abs(ndx) <= 160 && Math.abs(ndy) <= 116;
        const isWalletCorner = (Math.abs(ndx) > 130 && Math.abs(ndy) > 86) &&
          (Math.hypot(Math.abs(ndx) - 130, Math.abs(ndy) - 86) > 30);
        const inWallet = inWalletBox && !isWalletCorner;

        // Wallet border outline (width 26px)
        const innerWalletBox = Math.abs(ndx) <= 134 && Math.abs(ndy) <= 90;
        const isInnerCorner = (Math.abs(ndx) > 114 && Math.abs(ndy) > 70) &&
          (Math.hypot(Math.abs(ndx) - 114, Math.abs(ndy) - 70) > 20);
        const inInnerWallet = innerWalletBox && !isInnerCorner;

        const isWalletStroke = inWallet && !inInnerWallet;

        // Horizontal divider line at y = -36
        const isDivider = Math.abs(ndy - (-36)) <= 13 && Math.abs(ndx) <= 140;

        // Card latch at x in [30, 90], y in [16, 44]
        const isLatch = Math.abs(ndx - 60) <= 30 && Math.abs(ndy - 30) <= 14;

        // Currency sign (vertical bar at x=-60, horizontal bar at y=24)
        const isCurrVertical = Math.abs(ndx - (-60)) <= 12 && ndy >= 4 && ndy <= 56;
        const isCurrHorizontal = Math.abs(ndy - 24) <= 12 && ndx >= -82 && ndx <= -38;

        if (isWalletStroke || isDivider || isLatch || isCurrVertical || isCurrHorizontal) {
          r = 255;
          g = 255;
          b = 255;
        }
      }

      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const deflated = zlib.deflateSync(rawData, { level: 9 });

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

  // sRGB chunk (Rendering intent: Perceptual)
  const srgbChunk = makeChunk('sRGB', Buffer.from([0]));

  // IDAT chunk
  const idatChunk = makeChunk('IDAT', deflated);

  // IEND chunk
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, srgbChunk, idatChunk, iendChunk]);
}

function crc32(buf) {
  return zlib.crc32(buf);
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

// 1. Any icon 192x192
const pwa192 = createPngIcon(192, 192, false);
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), pwa192);

// 2. Any icon 512x512
const pwa512 = createPngIcon(512, 512, false);
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), pwa512);

// 3. Maskable icon 512x512 (MUST be 100% full bleed opaque!)
const pwaMaskable512 = createPngIcon(512, 512, true);
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), pwaMaskable512);

// 4. Apple Touch Icon 180x180
const appleTouchIcon = createPngIcon(180, 180, true);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), appleTouchIcon);

// 5. Favicon 32x32
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), createPngIcon(32, 32, false));

console.log('All compliant PWA icons generated successfully in /public!');
