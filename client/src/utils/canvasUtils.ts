import { DrawEvent, Point } from '../types';

export interface CanvasRenderer {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
}

// Image element cache to prevent creating new Image() instances on every render
const imageCache = new Map<string, HTMLImageElement>();

/**
 * Setup canvas with proper device pixel ratio for crisp rendering on HiDPI screens.
 */
export function setupCanvas(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext('2d')!;
  const dpr = window.devicePixelRatio || 1;

  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  return ctx;
}

/**
 * Resize canvas maintaining its content.
 */
export function resizeCanvas(
  canvas: HTMLCanvasElement,
  _ctx: CanvasRenderingContext2D
): void {
  const imageData = canvas.toDataURL();
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();

  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;

  const ctx = canvas.getContext('2d')!;
  ctx.scale(dpr, dpr);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const img = new Image();
  img.onload = () => {
    ctx.drawImage(img, 0, 0);
  };
  img.src = imageData;
}

/**
 * Draw a pencil/eraser stroke given an array of points.
 */
export function drawStroke(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  color: string,
  brushSize: number,
  tool: 'pencil' | 'eraser' | 'brush'
): void {
  if (points.length < 1) return;

  ctx.save();
  ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = tool === 'brush' ? brushSize * 1.5 : brushSize;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (tool === 'brush') {
    ctx.globalAlpha = 0.85;
  }

  if (points.length === 1) {
    ctx.beginPath();
    ctx.arc(points[0].x, points[0].y, (tool === 'brush' ? brushSize * 1.5 : brushSize) / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  for (let i = 1; i < points.length - 1; i++) {
    const midX = (points[i].x + points[i + 1].x) / 2;
    const midY = (points[i].y + points[i + 1].y) / 2;
    ctx.quadraticCurveTo(points[i].x, points[i].y, midX, midY);
  }

  const last = points[points.length - 1];
  ctx.lineTo(last.x, last.y);
  ctx.stroke();
  ctx.restore();
}

/**
 * Draw a straight line between two points.
 */
export function drawLine(
  ctx: CanvasRenderingContext2D,
  start: Point,
  end: Point,
  color: string,
  brushSize: number
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = brushSize;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.stroke();
  ctx.restore();
}

/**
 * Draw an arrow between two points.
 */
export function drawArrow(
  ctx: CanvasRenderingContext2D,
  start: Point,
  end: Point,
  color: string,
  brushSize: number
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = brushSize;
  ctx.lineCap = 'round';

  // Draw main line
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.stroke();

  // Draw arrowhead
  const angle = Math.atan2(end.y - start.y, end.x - start.x);
  const headLength = Math.max(12, brushSize * 3);

  ctx.beginPath();
  ctx.moveTo(end.x, end.y);
  ctx.lineTo(
    end.x - headLength * Math.cos(angle - Math.PI / 6),
    end.y - headLength * Math.sin(angle - Math.PI / 6)
  );
  ctx.lineTo(
    end.x - headLength * Math.cos(angle + Math.PI / 6),
    end.y - headLength * Math.sin(angle + Math.PI / 6)
  );
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/**
 * Draw a rectangle outline given two corner points.
 */
export function drawRectangle(
  ctx: CanvasRenderingContext2D,
  start: Point,
  end: Point,
  color: string,
  brushSize: number
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = brushSize;
  ctx.lineCap = 'square';
  ctx.beginPath();
  ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
  ctx.restore();
}

/**
 * Draw a triangle given two corner points (bounding box).
 */
export function drawTriangle(
  ctx: CanvasRenderingContext2D,
  start: Point,
  end: Point,
  color: string,
  brushSize: number
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = brushSize;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const topX = (start.x + end.x) / 2;
  const topY = start.y;
  const leftX = start.x;
  const leftY = end.y;
  const rightX = end.x;
  const rightY = end.y;

  ctx.beginPath();
  ctx.moveTo(topX, topY);
  ctx.lineTo(rightX, rightY);
  ctx.lineTo(leftX, leftY);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

/**
 * Draw a circle/ellipse given two corner points (bounding box).
 */
export function drawCircle(
  ctx: CanvasRenderingContext2D,
  start: Point,
  end: Point,
  color: string,
  brushSize: number
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = brushSize;

  const cx = (start.x + end.x) / 2;
  const cy = (start.y + end.y) / 2;
  const rx = Math.abs(end.x - start.x) / 2;
  const ry = Math.abs(end.y - start.y) / 2;

  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

/**
 * Render a text object onto the canvas.
 */
export function drawText(
  ctx: CanvasRenderingContext2D,
  point: Point,
  text: string,
  color: string,
  fontSize: number = 24,
  fontFamily: string = 'Inter, sans-serif',
  isBold: boolean = false,
  isItalic: boolean = false
): void {
  if (!text) return;
  ctx.save();
  const fontStyle = `${isItalic ? 'italic ' : ''}${isBold ? 'bold ' : ''}${fontSize}px ${fontFamily}`;
  ctx.font = fontStyle;
  ctx.fillStyle = color;
  ctx.textBaseline = 'top';

  const lines = text.split('\n');
  const lineHeight = fontSize * 1.25;
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], point.x, point.y + i * lineHeight);
  }
  ctx.restore();
}

/**
 * Render a sticky note card onto the canvas.
 */
export function drawStickyNote(
  ctx: CanvasRenderingContext2D,
  point: Point,
  text: string,
  noteColor: string = '#FEF08A', // Yellow default
  width: number = 180,
  height: number = 180
): void {
  ctx.save();

  // Shadow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetX = 3;
  ctx.shadowOffsetY = 5;

  // Background card
  ctx.fillStyle = noteColor;
  const radius = 8;
  const { x, y } = point;

  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.fill();

  // Reset shadow for text
  ctx.shadowColor = 'transparent';

  // Text inside note
  ctx.fillStyle = '#1F2937'; // Dark gray text
  ctx.font = '500 16px Inter, system-ui, sans-serif';
  ctx.textBaseline = 'top';

  const padding = 14;
  const maxWidth = width - padding * 2;
  const words = text.split(' ');
  let line = '';
  let currentY = y + padding;
  const lineHeight = 22;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line, x + padding, currentY);
      line = words[n] + ' ';
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x + padding, currentY);

  ctx.restore();
}

/**
 * Render an uploaded image object onto the canvas.
 */
export function drawImageObject(
  ctx: CanvasRenderingContext2D,
  point: Point,
  imageUrl: string,
  width: number = 200,
  height: number = 200,
  onLoad?: () => void
): void {
  if (!imageUrl) return;

  const cached = imageCache.get(imageUrl);
  if (cached && cached.complete) {
    ctx.save();
    ctx.drawImage(cached, point.x, point.y, width, height);
    ctx.restore();
    return;
  }

  const img = new Image();
  img.onload = () => {
    imageCache.set(imageUrl, img);
    ctx.save();
    ctx.drawImage(img, point.x, point.y, width, height);
    ctx.restore();
    onLoad?.();
  };
  img.src = imageUrl;
}

/**
 * Fast 4-way stack-based flood fill algorithm on canvas context.
 */
export function floodFill(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  startX: number,
  startY: number,
  fillColorHex: string
): void {
  const dpr = window.devicePixelRatio || 1;
  const px = Math.floor(startX * dpr);
  const py = Math.floor(startY * dpr);

  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;
  const width = canvas.width;
  const height = canvas.height;

  if (px < 0 || px >= width || py < 0 || py >= height) return;

  // Convert hex color to RGBA
  const tempEl = document.createElement('div');
  tempEl.style.color = fillColorHex;
  document.body.appendChild(tempEl);
  const rgbStr = getComputedStyle(tempEl).color;
  document.body.removeChild(tempEl);

  const rgbMatch = rgbStr.match(/\d+/g);
  if (!rgbMatch || rgbMatch.length < 3) return;

  const targetR = parseInt(rgbMatch[0], 10);
  const targetG = parseInt(rgbMatch[1], 10);
  const targetB = parseInt(rgbMatch[2], 10);
  const targetA = 255;

  const startPos = (py * width + px) * 4;
  const startR = data[startPos];
  const startG = data[startPos + 1];
  const startB = data[startPos + 2];
  const startA = data[startPos + 3];

  // Already the target color
  if (
    Math.abs(startR - targetR) < 5 &&
    Math.abs(startG - targetG) < 5 &&
    Math.abs(startB - targetB) < 5 &&
    Math.abs(startA - targetA) < 5
  ) {
    return;
  }

  function colorMatch(pos: number): boolean {
    const r = data[pos];
    const g = data[pos + 1];
    const b = data[pos + 2];
    const a = data[pos + 3];

    return (
      Math.abs(r - startR) < 30 &&
      Math.abs(g - startG) < 30 &&
      Math.abs(b - startB) < 30 &&
      Math.abs(a - startA) < 30
    );
  }

  const stack: [number, number][] = [[px, py]];
  const visited = new Uint8Array(width * height);

  let count = 0;
  const maxPixels = width * height;

  while (stack.length > 0 && count < maxPixels) {
    const [x, y] = stack.pop()!;
    const idx = y * width + x;

    if (visited[idx]) continue;
    visited[idx] = 1;
    count++;

    const pos = idx * 4;
    if (!colorMatch(pos)) continue;

    // Fill pixel
    data[pos] = targetR;
    data[pos + 1] = targetG;
    data[pos + 2] = targetB;
    data[pos + 3] = targetA;

    if (x > 0) stack.push([x - 1, y]);
    if (x < width - 1) stack.push([x + 1, y]);
    if (y > 0) stack.push([x, y - 1]);
    if (y < height - 1) stack.push([x, y + 1]);
  }

  ctx.putImageData(imgData, 0, 0);
}

/**
 * Render a DrawEvent onto the canvas.
 */
export function renderDrawEvent(
  ctx: CanvasRenderingContext2D,
  event: DrawEvent,
  onImageLoad?: () => void
): void {
  if (event.type !== 'draw_end' || event.isDeleted) return;
  if (event.points.length === 0) return;

  const { tool, color, brushSize, points } = event;
  const start = points[0];
  const end = points[points.length - 1] ?? start;

  switch (tool) {
    case 'pencil':
    case 'eraser':
    case 'brush':
      drawStroke(ctx, points, color, brushSize, tool);
      break;
    case 'line':
      drawLine(ctx, start, end, color, brushSize);
      break;
    case 'arrow':
      drawArrow(ctx, start, end, color, brushSize);
      break;
    case 'rectangle':
      drawRectangle(ctx, start, end, color, brushSize);
      break;
    case 'triangle':
      drawTriangle(ctx, start, end, color, brushSize);
      break;
    case 'circle':
      drawCircle(ctx, start, end, color, brushSize);
      break;
    case 'fill':
      if (ctx.canvas) {
        floodFill(ctx, ctx.canvas, start.x, start.y, color);
      }
      break;
    case 'text':
      if (event.text) {
        drawText(
          ctx,
          start,
          event.text,
          color,
          event.fontSize ?? 24,
          event.fontFamily ?? 'Inter, sans-serif',
          event.isBold ?? false,
          event.isItalic ?? false
        );
      }
      break;
    case 'sticky':
      drawStickyNote(
        ctx,
        start,
        event.text ?? '',
        event.noteColor ?? '#FEF08A',
        event.width ?? 180,
        event.height ?? 180
      );
      break;
    case 'image':
      if (event.imageUrl) {
        drawImageObject(
          ctx,
          start,
          event.imageUrl,
          event.width ?? 200,
          event.height ?? 200,
          onImageLoad
        );
      }
      break;
  }
}

/**
 * Replay a full drawing history onto the canvas.
 */
export function replayHistory(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  history: DrawEvent[],
  onImageLoad?: () => void
): void {
  const dpr = window.devicePixelRatio || 1;
  ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

  for (const event of history) {
    if (event.isDeleted) continue;
    if (event.type === 'clear') {
      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    } else {
      renderDrawEvent(ctx, event, onImageLoad);
    }
  }
}
