import type { VocabItem } from '../db/database';
import { formatWordWithArticle } from '../utils/german';

const cardImageCache = new Map<string, string>();

/**
 * Renders a crisp offscreen HTML5 Canvas Spider-Verse comic-panel card
 * (Ben-Day halftones, Spider-Man corner emblem, RGB-split German word, and meaning)
 * and caches the resulting data URI for notification attachments.
 */
export function renderSpiderVerseComicCard(word: VocabItem): string | null {
  if (typeof document === 'undefined') return null;

  const fullWord = formatWordWithArticle(word.article, word.german);
  const cacheKey = `${word.id ?? fullWord}|${word.meaning}|${word.meaningVi ?? ''}`;
  const cached = cardImageCache.get(cacheKey);
  if (cached) return cached;

  const width = 800;
  const height = 400;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // 1. Deep navy-ink background (#0D0E1C)
  ctx.fillStyle = '#0D0E1C';
  ctx.fillRect(0, 0, width, height);

  // 2. Diagonal Ben-Day halftone dot pattern
  for (let y = 12; y < height; y += 22) {
    for (let x = 12; x < width; x += 22) {
      const ratio = (x + y) / (width + height);
      ctx.fillStyle = ratio < 0.5 ? 'rgba(0, 240, 255, 0.14)' : 'rgba(255, 0, 85, 0.14)';
      ctx.beginPath();
      ctx.arc(x, y, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 3. Subtle diagonal comic hatch lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.lineWidth = 2;
  for (let i = -height; i < width + height; i += 24) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i - height * 0.45, height);
    ctx.stroke();
  }

  // 4. Chromatic RGB-split panel border + black hand-inked border
  ctx.fillStyle = '#FF0055';
  ctx.fillRect(14, 22, width - 36, height - 36);
  ctx.fillStyle = '#00F0FF';
  ctx.fillRect(22, 14, width - 36, height - 36);
  ctx.fillStyle = '#0D0E1C';
  ctx.fillRect(18, 18, width - 36, height - 36);
  ctx.strokeStyle = '#090A14';
  ctx.lineWidth = 6;
  ctx.strokeRect(18, 18, width - 36, height - 36);

  // 5. Diagonal comic gutter slash on left
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(18, 18);
  ctx.lineTo(245, 18);
  ctx.lineTo(185, height - 18);
  ctx.lineTo(18, height - 18);
  ctx.closePath();
  ctx.fillStyle = '#181A33';
  ctx.fill();
  ctx.strokeStyle = '#FFE600';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(245, 18);
  ctx.lineTo(185, height - 18);
  ctx.stroke();
  ctx.restore();

  // 6. Spider-Man corner mask emblem (RGB split + crimson mask + white eyes)
  const drawMask = (ox: number, oy: number, fill: string) => {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.ellipse(ox, oy, 54, 68, 0, 0, Math.PI * 2);
    ctx.fill();
  };
  drawMask(112, 198, '#00F0FF');
  drawMask(124, 208, '#FF0055');
  drawMask(118, 203, '#E23636');
  ctx.strokeStyle = '#090A14';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.ellipse(118, 203, 54, 68, 0, 0, Math.PI * 2);
  ctx.stroke();

  // White comic eyes
  const drawEye = (dir: number) => {
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#090A14';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(118 + dir * 10, 195);
    ctx.lineTo(118 + dir * 42, 174);
    ctx.quadraticCurveTo(118 + dir * 44, 212, 118 + dir * 12, 212);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  };
  drawEye(-1);
  drawEye(1);

  // 7. Tilted Yellow Comic Caption Box
  ctx.save();
  ctx.translate(275, 58);
  ctx.rotate((-2 * Math.PI) / 180);
  ctx.fillStyle = '#FFE600';
  ctx.fillRect(0, 0, 420, 42);
  ctx.strokeStyle = '#090A14';
  ctx.lineWidth = 4;
  ctx.strokeRect(0, 0, 420, 42);
  ctx.fillStyle = '#090A14';
  ctx.font = '900 18px Impact, "Arial Black", sans-serif';
  ctx.fillText('MEANWHILE IN YOUR LEARN LIST...', 14, 27);
  ctx.restore();

  // 8. RGB-Split Glitch Text for the German Word
  const wordX = 278;
  const wordY = 205;
  ctx.font = '900 54px Impact, "Arial Black", sans-serif';
  ctx.fillStyle = '#00F0FF';
  ctx.fillText(fullWord, wordX - 4, wordY - 3);
  ctx.fillStyle = '#FF0055';
  ctx.fillText(fullWord, wordX + 4, wordY + 3);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(fullWord, wordX, wordY);

  // 9. Meaning (EN / VI) & Level Badge
  const meaningLine = word.meaningVi
    ? `${word.meaning} • ${word.meaningVi}`
    : word.meaning;
  ctx.fillStyle = '#E2E8F0';
  ctx.font = '700 24px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillText(meaningLine.slice(0, 44), wordX, 265);

  ctx.fillStyle = '#00F0FF';
  ctx.font = '900 18px Impact, "Arial Black", sans-serif';
  ctx.fillText(`⚡ THWIP!  •  ${word.level}  •  ${word.topic.toUpperCase()}`, wordX, 325);

  const dataUrl = canvas.toDataURL('image/png');
  cardImageCache.set(cacheKey, dataUrl);
  return dataUrl;
}
