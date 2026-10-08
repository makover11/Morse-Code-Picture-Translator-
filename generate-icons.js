// generate-icons.js
// Standalone Node.js script to generate SVG and PNG icons (16, 32, 48, 128)
// Uses built-in zlib and fs without any external npm packages.

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// PNG chunk helper
function makeChunk(type, data) {
  const len = data.length;
  const buf = Buffer.alloc(8 + len + 4);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4, 4, 'ascii');
  data.copy(buf, 8);
  const crc = zlib.crc32(buf.subarray(4, 8 + len));
  buf.writeUInt32BE(crc, 8 + len);
  return buf;
}

function createPng(width, height, rgbaBuffer) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // 8-bit depth
  ihdr.writeUInt8(6, 9); // RGBA
  ihdr.writeUInt8(0, 10);
  ihdr.writeUInt8(0, 11);
  ihdr.writeUInt8(0, 12);
  const ihdrChunk = makeChunk('IHDR', ihdr);

  // Scanlines with filter byte 0
  const scanlineLen = 1 + width * 4;
  const rawData = Buffer.alloc(height * scanlineLen);
  for (let y = 0; y < height; y++) {
    const rowOffset = y * scanlineLen;
    rawData[rowOffset] = 0; // Filter 0 (None)
    rgbaBuffer.copy(rawData, rowOffset + 1, y * width * 4, (y + 1) * width * 4);
  }

  const compressed = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Draw the Morse Picture Icon for given size
function drawIcon(size) {
  const buf = Buffer.alloc(size * size * 4);

  function setPixel(x, y, r, g, b, a = 255) {
    if (x < 0 || x >= size || y < 0 || y >= size) return;
    const idx = (y * size + x) * 4;
    // Simple alpha blending
    const srcA = a / 255;
    const dstA = buf[idx + 3] / 255;
    const outA = srcA + dstA * (1 - srcA);
    if (outA <= 0) return;
    buf[idx + 0] = Math.round((r * srcA + buf[idx + 0] * dstA * (1 - srcA)) / outA);
    buf[idx + 1] = Math.round((g * srcA + buf[idx + 1] * dstA * (1 - srcA)) / outA);
    buf[idx + 2] = Math.round((b * srcA + buf[idx + 2] * dstA * (1 - srcA)) / outA);
    buf[idx + 3] = Math.round(outA * 255);
  }

  const radius = size * 0.22;
  const cx = size / 2;
  const cy = size / 2;

  // Background: Rounded Dark Slate Box
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // Calculate distance to rounded corner
      const dx = Math.max(0, Math.abs(x - cx) - (cx - radius));
      const dy = Math.max(0, Math.abs(y - cy) - (cy - radius));
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= radius) {
        // Gradient from #0f172a to #1e293b
        const factor = y / size;
        const r = Math.round(15 + factor * 15);
        const g = Math.round(23 + factor * 20);
        const b = Math.round(42 + factor * 25);
        setPixel(x, y, r, g, b, 255);
      } else if (dist <= radius + 1) {
        // Anti-aliased outer edge
        const alpha = Math.max(0, Math.min(255, Math.round((1 - (dist - radius)) * 255)));
        setPixel(x, y, 15, 23, 42, alpha);
      }
    }
  }

  // Draw Camera / Picture Frame subtle outline in Cyan/Teal #38bdf8
  const frameMargin = Math.round(size * 0.16);
  const frameW = size - frameMargin * 2;
  const frameH = size - frameMargin * 2;
  const strokeW = Math.max(1, Math.round(size * 0.05));

  for (let y = frameMargin; y < frameMargin + frameH; y++) {
    for (let x = frameMargin; x < frameMargin + frameW; x++) {
      const isEdge =
        x < frameMargin + strokeW ||
        x >= frameMargin + frameW - strokeW ||
        y < frameMargin + strokeW ||
        y >= frameMargin + frameH - strokeW;
      if (isEdge) {
        // Corner cutouts or lens look
        const cornerDist = Math.min(
          Math.hypot(x - frameMargin, y - frameMargin),
          Math.hypot(x - (frameMargin + frameW), y - frameMargin),
          Math.hypot(x - frameMargin, y - (frameMargin + frameH)),
          Math.hypot(x - (frameMargin + frameW), y - (frameMargin + frameH))
        );
        if (cornerDist > 1.5) {
          setPixel(x, y, 56, 189, 248, 140); // Soft cyan frame #38bdf8
        }
      }
    }
  }

  // Draw Morse Elements in center: Dot (left), Dash (middle), Dot (right)
  // Gold / Yellow: #facc15 (250, 204, 21)
  const dotR = Math.max(1.2, size * 0.08);
  const dot1X = size * 0.30;
  const dot2X = size * 0.70;
  const midY = size * 0.50;

  // Dot 1
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const d1 = Math.hypot(x - dot1X, y - midY);
      if (d1 <= dotR) {
        setPixel(x, y, 250, 204, 21, 255);
      } else if (d1 <= dotR + 0.8) {
        const a = Math.round((1 - (d1 - dotR) / 0.8) * 255);
        setPixel(x, y, 250, 204, 21, a);
      }

      // Dot 2
      const d2 = Math.hypot(x - dot2X, y - midY);
      if (d2 <= dotR) {
        setPixel(x, y, 250, 204, 21, 255);
      } else if (d2 <= dotR + 0.8) {
        const a = Math.round((1 - (d2 - dotR) / 0.8) * 255);
        setPixel(x, y, 250, 204, 21, a);
      }
    }
  }

  // Dash in Center
  const dashW = Math.max(3, size * 0.22);
  const dashH = Math.max(2, dotR * 1.8);
  const dashX = cx - dashW / 2;
  const dashY = cy - dashH / 2;
  const dashR = dashH / 2;

  for (let y = Math.floor(dashY - 1); y <= Math.ceil(dashY + dashH + 1); y++) {
    for (let x = Math.floor(dashX - 1); x <= Math.ceil(dashX + dashW + 1); x++) {
      const dx = Math.max(0, Math.abs(x - cx) - (dashW / 2 - dashR));
      const dy = Math.max(0, Math.abs(y - cy));
      const dist = Math.hypot(dx, dy);
      if (dist <= dashR) {
        setPixel(x, y, 250, 204, 21, 255);
      } else if (dist <= dashR + 0.8) {
        const a = Math.round((1 - (dist - dashR) / 0.8) * 255);
        setPixel(x, y, 250, 204, 21, a);
      }
    }
  }

  return buf;
}

// Generate SVG
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>
  <!-- Background Card -->
  <rect x="4" y="4" width="120" height="120" rx="26" fill="url(#bgGrad)" stroke="#334155" stroke-width="2"/>
  <!-- Picture Frame Outline -->
  <rect x="18" y="18" width="92" height="92" rx="14" fill="none" stroke="#38bdf8" stroke-width="3" stroke-dasharray="8 6" opacity="0.6"/>
  <!-- Top Flash Lens Indicator -->
  <circle cx="64" cy="30" r="5" fill="#38bdf8" opacity="0.9"/>
  <!-- Morse Code: Dot - Dash - Dot (• — •) -->
  <g filter="url(#glow)">
    <circle cx="38" cy="66" r="10" fill="#facc15"/>
    <rect x="52" y="58" width="28" height="16" rx="8" fill="#facc15"/>
    <circle cx="94" cy="66" r="10" fill="#facc15"/>
  </g>
  <!-- Picture Wave / Baseline -->
  <path d="M28 92 C 45 84, 55 98, 70 90 C 85 82, 95 94, 100 88" fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round"/>
</svg>`;

const iconsDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Write SVG
fs.writeFileSync(path.join(iconsDir, 'icon.svg'), svgContent.trim());
console.log('Saved icons/icon.svg');

// Write PNGs for 16, 32, 48, 128
const sizes = [16, 32, 48, 128];
for (const s of sizes) {
  const rgba = drawIcon(s);
  const png = createPng(s, s, rgba);
  fs.writeFileSync(path.join(iconsDir, `icon${s}.png`), png);
  console.log(`Saved icons/icon${s}.png (${png.length} bytes)`);
}

console.log('Icon generation complete!');
