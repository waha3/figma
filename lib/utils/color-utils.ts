import type { Color } from "@figma/rest-api-spec";

export function colorToRGB(color: Color): {
  r: number;
  g: number;
  b: number;
  a: number;
} {
  return {
    r: Math.round(color.r * 255),
    g: Math.round(color.g * 255),
    b: Math.round(color.b * 255),
    a: color.a ?? 1,
  };
}

export function rgbToString(color: {
  r: number;
  g: number;
  b: number;
  a: number;
}): string {
  const { r, g, b, a } = color;
  return a < 1 ? `rgba(${r}, ${g}, ${b}, ${a})` : `rgb(${r}, ${g}, ${b})`;
}

export function colorToCSS(color: Color): string {
  return rgbToString(colorToRGB(color));
}
