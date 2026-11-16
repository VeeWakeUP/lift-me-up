// One-off helper: renders the PNG app icons used by the web manifest and iOS Home Screen.
// Run with: node scripts/make-icons.mjs
import sharp from 'sharp';
import { writeFileSync } from 'node:fs';

const svg = (rounded) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" ${rounded ? 'rx="14"' : ''} fill="#2B1055"/>
  <path d="M10 44a22 22 0 0 1 44 0z" fill="#FF6A1A"/>
  <path d="M32 14l4.5 10.5L47 29l-10.5 4.5L32 44l-4.5-10.5L17 29l10.5-4.5z" fill="#C8FF3D"/>
</svg>`;

const jobs = [
  ['public/icon-192.png', 192, true],
  ['public/icon-512.png', 512, true],
  ['public/apple-touch-icon.png', 180, false], // iOS applies its own rounding
];
for (const [file, size, rounded] of jobs) {
  writeFileSync(file, await sharp(Buffer.from(svg(rounded))).resize(size, size).png().toBuffer());
  console.log('wrote', file);
}
