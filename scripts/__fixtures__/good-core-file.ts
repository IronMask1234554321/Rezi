// This file contains only allowed patterns
export type Rgb = Readonly<{ r: number; g: number; b: number }>;

export function rgb(r: number, g: number, b: number): Rgb {
  return { r, g, b };
}

// Using Uint8Array (allowed) instead of Buffer
const bytes = new Uint8Array([1, 2, 3]);
export { bytes };
