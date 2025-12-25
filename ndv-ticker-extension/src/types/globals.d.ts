// Global declarations for legacy popup scripts loaded via index.html.
// Keep this lightweight; refine types as modules are migrated to TypeScript.

import type { JQueryStatic } from 'jquery';

declare global {
  const $: JQueryStatic;

  // Canvas context defined in init-canvas.js
  const context: CanvasRenderingContext2D;

  // Objects provided by other legacy scripts
  const tsunami: any;
  const typh_comment: any;
  const warn_current: any;
  const TrafficTracker: any;

  interface CanvasRenderingContext2D {
    // Custom renderer attached elsewhere
    drawTextureImage?: (type: string, x: number, y: number, option?: any) => void;
  }

  interface HTMLImageElement {
    toImageData?: () => ImageData;
    imgBmp?: ImageBitmap;
  }
}

export {};
