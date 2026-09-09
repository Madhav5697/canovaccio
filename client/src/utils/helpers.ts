import { Point, DrawTool } from '../types';

/**
 * Generate a UUID v4 (random) — simple implementation for browsers without crypto.randomUUID
 */
export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Generate a short random user ID (not a UUID, just a human-friendly ID)
 */
export function generateUserId(): string {
  const adjectives = ['Swift', 'Bold', 'Bright', 'Cool', 'Daring', 'Epic', 'Fast', 'Grand'];
  const animals = ['Fox', 'Bear', 'Wolf', 'Hawk', 'Lion', 'Tiger', 'Eagle', 'Panda'];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const animal = animals[Math.floor(Math.random() * animals.length)];
  const num = Math.floor(Math.random() * 100);
  return `${adj}${animal}${num}`;
}

/**
 * Get the position of a mouse or touch event relative to a canvas element.
 */
export function getCanvasPoint(
  e: MouseEvent | TouchEvent,
  canvas: HTMLCanvasElement
): Point {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;

  // Since canvas.width is scaled by DPR and ctx is scaled by DPR,
  // we calculate the position in CSS pixels relative to the canvas bounding rect.
  const scaleX = rect.width > 0 ? (canvas.width / dpr) / rect.width : 1;
  const scaleY = rect.height > 0 ? (canvas.height / dpr) / rect.height : 1;

  let clientX = 0;
  let clientY = 0;

  if ('touches' in e && (e as TouchEvent).touches && (e as TouchEvent).touches.length > 0) {
    clientX = (e as TouchEvent).touches[0].clientX;
    clientY = (e as TouchEvent).touches[0].clientY;
  } else if ('changedTouches' in e && (e as TouchEvent).changedTouches && (e as TouchEvent).changedTouches.length > 0) {
    clientX = (e as TouchEvent).changedTouches[0].clientX;
    clientY = (e as TouchEvent).changedTouches[0].clientY;
  } else {
    clientX = (e as MouseEvent).clientX;
    clientY = (e as MouseEvent).clientY;
  }

  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY,
  };
}

/**
 * Throttle a function to at most once per `limit` ms.
 */
export function throttle<T extends (...args: Parameters<T>) => void>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    const now = Date.now();
    const remaining = limit - (now - lastCall);

    if (remaining <= 0) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      lastCall = now;
      fn(...args);
    } else if (!timeout) {
      timeout = setTimeout(() => {
        lastCall = Date.now();
        timeout = null;
        fn(...args);
      }, remaining);
    }
  };
}

/**
 * Validate a room ID format: 6 uppercase alphanumeric characters.
 */
export function isValidRoomId(roomId: string): boolean {
  return /^[A-Z0-9]{6}$/.test(roomId);
}

/**
 * Format a room ID for display (uppercase).
 */
export function formatRoomId(roomId: string): string {
  return roomId.toUpperCase();
}

/**
 * Copy text to clipboard, returns true if successful.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    // Fallback
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    return true;
  } catch {
    return false;
  }
}

/**
 * Clamp a number between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Distance between two points.
 */
export function distance(a: Point, b: Point): number {
  return Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
}

/**
 * Generate a custom SVG cursor data URI based on the active tool and color.
 */
export function getToolCursor(tool: DrawTool, color: string): string {
  const strokeColor = color.toLowerCase() === '#ffffff' ? '#3b82f6' : color;
  const filter = 'style="filter:drop-shadow(0px 1px 2px rgba(0,0,0,0.6));"';

  let svg = '';
  let hotX = 12;
  let hotY = 12;
  let fallback = 'crosshair';

  switch (tool) {
    case 'pencil':
      svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${strokeColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" ${filter}><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>`;
      hotX = 2;
      hotY = 22;
      fallback = 'crosshair';
      break;

    case 'eraser':
      svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" ${filter}><path d="m7 21-4.3-4.3a1 1 0 0 1 0-1.4l12-12a1 1 0 0 1 1.4 0l4.3 4.3a1 1 0 0 1 0 1.4l-12 12a1 1 0 0 1-1.4 0Z"/><path d="m22 21-10 0"/><path d="m5 11 4.5 4.5"/></svg>`;
      hotX = 4;
      hotY = 20;
      fallback = 'cell';
      break;

    case 'brush':
      svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${strokeColor}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" ${filter}><path d="m9.06 11.9 8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08"/><path d="M7.07 14.94c-1.66 0-3 1.35-3 3 0 1.96-1.6 2.06-2.07 2.06 2.5 1 5.5.5 7.07-1.06 1.57-1.57 1.57-4 0-5.57z"/></svg>`;
      hotX = 2;
      hotY = 22;
      fallback = 'crosshair';
      break;

    case 'fill':
      svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${strokeColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" ${filter}><path d="m19 11-8-8-8.6 8.6a2 2 0 0 0 0 2.8l5.2 5.2c.8.8 2 .8 2.8 0L19 11Z"/><path d="m5 2 5 5"/><path d="M2 13h15"/><path d="M22 20a2 2 0 1 1-4 0c0-1.6 1.7-2.4 2-4 .3 1.6 2 2.4 2 4Z"/></svg>`;
      hotX = 4;
      hotY = 20;
      fallback = 'crosshair';
      break;

    case 'line':
      svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${strokeColor}" stroke-width="2.5" stroke-linecap="round" ${filter}><line x1="4" y1="20" x2="20" y2="4"/><circle cx="12" cy="12" r="2" fill="${strokeColor}"/></svg>`;
      hotX = 12;
      hotY = 12;
      fallback = 'crosshair';
      break;

    case 'arrow':
      svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${strokeColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" ${filter}><line x1="5" y1="19" x2="19" y2="5"/><polyline points="12 5 19 5 19 12"/></svg>`;
      hotX = 19;
      hotY = 5;
      fallback = 'crosshair';
      break;

    case 'rectangle':
      svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${strokeColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" ${filter}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="12" cy="12" r="2" fill="${strokeColor}"/></svg>`;
      hotX = 12;
      hotY = 12;
      fallback = 'crosshair';
      break;

    case 'triangle':
      svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${strokeColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" ${filter}><path d="M12 3 L21 20 L3 20 Z"/><circle cx="12" cy="13" r="2" fill="${strokeColor}"/></svg>`;
      hotX = 12;
      hotY = 12;
      fallback = 'crosshair';
      break;

    case 'circle':
      svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${strokeColor}" stroke-width="2.5" ${filter}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2" fill="${strokeColor}"/></svg>`;
      hotX = 12;
      hotY = 12;
      fallback = 'crosshair';
      break;

    case 'text':
      return 'text';

    case 'sticky':
      return 'cell';

    case 'select':
      return 'default';

    case 'pan':
      return 'grab';

    default:
      return 'crosshair';
  }

  const encodedSvg = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  return `url("${encodedSvg}") ${hotX} ${hotY}, ${fallback}`;
}
