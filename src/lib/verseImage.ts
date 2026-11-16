/**
 * Draws the verse as a PNG on a plain <canvas>: no extra dependency, and the result
 * never contains any of the app's temporary drag UI. The look mirrors the on-screen
 * beige parchment page (paper, gold rule, handwritten heading and reference).
 */
import type { Lang } from '../data/content';

export interface VerseImageInput {
  text: string;
  reference: string;
  /** Handwritten heading at the top, e.g. "Verse of the Day". */
  label: string;
  paraphraseLabel: string;
  paraphraseNote: string;
  lang: Lang;
}

const W = 1080;
const H = 1350;
const INK = '#3a2814';
const ACCENT = '#6b440a';
const GOLD = '#a87722';
const STAMP = '#8f2418';

/** Small deterministic PRNG so the paper grain is identical every time. */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width <= maxWidth || !line) line = test;
    else {
      lines.push(line);
      line = w;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function corner(ctx: CanvasRenderingContext2D, x: number, y: number, sx: number, sy: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(sx, sy);
  ctx.strokeStyle = GOLD;
  ctx.fillStyle = GOLD;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(4, 70);
  ctx.lineTo(4, 22);
  ctx.quadraticCurveTo(4, 4, 22, 4);
  ctx.lineTo(70, 4);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(22, 22, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function fleuron(ctx: CanvasRenderingContext2D, cx: number, y: number) {
  ctx.save();
  ctx.strokeStyle = GOLD;
  ctx.fillStyle = GOLD;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(cx + s * 200, y);
    ctx.lineTo(cx + s * 70, y);
    ctx.bezierCurveTo(cx + s * 55, y - 24, cx + s * 35, y - 24, cx + s * 28, y - 6);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(cx, y - 14);
  ctx.lineTo(cx + 12, y);
  ctx.lineTo(cx, y + 14);
  ctx.lineTo(cx - 12, y);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export async function renderVerseImage(i: VerseImageInput): Promise<Blob> {
  const en = i.lang === 'en';
  const serif = '"Alegreya Variable", Georgia, "Times New Roman", serif';
  const hand = en ? '"Caveat Variable", "Alegreya Variable", cursive' : serif;
  const handStyle = en ? '700' : 'italic 700';

  // Make sure the web fonts (and the right glyph subset) are ready before drawing.
  try {
    await Promise.all([
      document.fonts.load(`500 60px "Alegreya Variable"`, i.text + i.reference),
      document.fonts.load(`italic 500 30px "Alegreya Variable"`, i.paraphraseNote + i.label),
      document.fonts.load(`700 60px "Caveat Variable"`, i.label + i.reference),
    ]);
  } catch {
    /* fall back to system fonts */
  }

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is not available');

  /* paper */
  ctx.fillStyle = '#f3e5c1';
  ctx.fillRect(0, 0, W, H);
  let g = ctx.createRadialGradient(W / 2, 0, 60, W / 2, 0, 900);
  g.addColorStop(0, 'rgba(255,247,222,0.9)');
  g.addColorStop(1, 'rgba(255,247,222,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  g = ctx.createRadialGradient(W / 2, H / 2, 380, W / 2, H / 2, 900);
  g.addColorStop(0, 'rgba(140,95,35,0)');
  g.addColorStop(1, 'rgba(140,95,35,0.3)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  const rnd = mulberry32(7);
  for (let n = 0; n < 3200; n++) {
    ctx.fillStyle = `rgba(110,75,35,${0.03 + rnd() * 0.05})`;
    ctx.fillRect(rnd() * W, rnd() * H, 1 + rnd() * 2, 1 + rnd() * 2);
  }

  /* gold rule and corners */
  ctx.strokeStyle = 'rgba(138,96,30,0.55)';
  ctx.lineWidth = 3;
  ctx.strokeRect(44, 44, W - 88, H - 88);
  corner(ctx, 34, 34, 1, 1);
  corner(ctx, W - 34, 34, -1, 1);
  corner(ctx, 34, H - 34, 1, -1);
  corner(ctx, W - 34, H - 34, -1, -1);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  /* heading */
  ctx.fillStyle = ACCENT;
  ctx.font = `${handStyle} ${en ? 96 : 72}px ${hand}`;
  ctx.fillText(i.label, W / 2, 190);
  fleuron(ctx, W / 2, 252);

  /* verse: largest size that fits the box, centred vertically */
  const boxX = 130;
  const boxW = W - boxX * 2;
  const boxTop = 320;
  const boxH = 640;
  let size = 78;
  let lines: string[] = [];
  let lineH = 0;
  for (; size >= 38; size -= 2) {
    ctx.font = `500 ${size}px ${serif}`;
    lines = wrap(ctx, i.text, boxW);
    lineH = size * 1.42;
    if (lines.length * lineH <= boxH) break;
  }
  ctx.fillStyle = INK;
  ctx.font = `500 ${size}px ${serif}`;
  const blockH = lines.length * lineH;
  let y = boxTop + (boxH - blockH) / 2 + size;
  for (const line of lines) {
    ctx.fillText(line, W / 2, y);
    y += lineH;
  }

  /* reference with hand-drawn underline */
  const refSize = en ? 80 : 54;
  ctx.fillStyle = ACCENT;
  ctx.font = `${handStyle} ${refSize}px ${hand}`;
  const refY = 1042;
  ctx.fillText(i.reference, W / 2, refY);
  const refW = Math.min(ctx.measureText(i.reference).width, boxW);
  ctx.strokeStyle = ACCENT;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(W / 2 - refW / 2, refY + 20);
  ctx.bezierCurveTo(W / 2 - refW / 4, refY + 10, W / 2 - refW / 8, refY + 28, W / 2, refY + 20);
  ctx.bezierCurveTo(W / 2 + refW / 6, refY + 12, W / 2 + refW / 3, refY + 26, W / 2 + refW / 2, refY + 18);
  ctx.stroke();

  /* paraphrase stamp + note */
  ctx.save();
  ctx.setLineDash([10, 10]);
  ctx.strokeStyle = 'rgba(58,40,20,0.3)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(130, 1112);
  ctx.lineTo(W - 130, 1112);
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.translate(W / 2, 1164);
  ctx.rotate((-3 * Math.PI) / 180);
  ctx.font = '800 26px "Manrope Variable", system-ui, sans-serif';
  const stampText = i.paraphraseLabel.toUpperCase();
  const stampW = ctx.measureText(stampText).width + 40;
  ctx.strokeStyle = STAMP;
  ctx.fillStyle = STAMP;
  ctx.lineWidth = 4;
  ctx.strokeRect(-stampW / 2, -26, stampW, 46);
  ctx.fillText(stampText, 0, 8);
  ctx.restore();

  ctx.fillStyle = '#5f4829';
  ctx.font = `italic 500 28px ${serif}`;
  const note = wrap(ctx, i.paraphraseNote, boxW);
  let ny = 1232;
  for (const line of note.slice(0, 2)) {
    ctx.fillText(line, W / 2, ny);
    ny += 36;
  }

  /* signature */
  ctx.fillStyle = ACCENT;
  ctx.font = `italic 800 34px ${serif}`;
  ctx.fillText('Lift Me Up', W / 2, 1316);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('PNG export failed'))), 'image/png');
  });
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}
