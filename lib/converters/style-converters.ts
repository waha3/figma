import type { Node } from "@figma/rest-api-spec";
import {
  TAILWIND_COLORS,
  SPACING_SCALE,
  BORDER_RADIUS_SCALE,
  FONT_SIZE_SCALE,
  FONT_WEIGHT_SCALE,
} from "../constants/tailwind-maps";
import { colorToRGB, rgbToString } from "../utils/color-utils";

function findClosest(value: number, options: number[]): number {
  return options.reduce((prev, curr) =>
    Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
  );
}

export function getLayoutClasses(node: Node): string[] {
  const classes: string[] = [];

  if (node.layoutMode === "HORIZONTAL" || node.layoutMode === "VERTICAL") {
    classes.push("flex");
    if (node.layoutMode === "VERTICAL") classes.push("flex-col");

    // Alignment
    const justifyMap: Record<string, string> = {
      MIN: "justify-start",
      CENTER: "justify-center",
      MAX: "justify-end",
      SPACE_BETWEEN: "justify-between",
      SPACE_AROUND: "justify-around",
      SPACE_EVENLY: "justify-evenly",
    };

    const alignMap: Record<string, string> = {
      MIN: "items-start",
      CENTER: "items-center",
      MAX: "items-end",
      BASELINE: "items-baseline",
      STRETCH: "items-stretch",
    };

    if (node.primaryAxisAlignItems && justifyMap[node.primaryAxisAlignItems]) {
      classes.push(justifyMap[node.primaryAxisAlignItems]);
    }

    if (node.counterAxisAlignItems && alignMap[node.counterAxisAlignItems]) {
      classes.push(alignMap[node.counterAxisAlignItems]);
    }

    // Gap
    if (node.itemSpacing) {
      const closest = findClosest(
        node.itemSpacing,
        Object.keys(SPACING_SCALE).map(Number)
      );
      if (SPACING_SCALE[closest]) {
        classes.push(`gap-${SPACING_SCALE[closest]}`);
      }
    }
  }

  return classes;
}

export function getSizeClasses(node: Node): string[] {
  const classes: string[] = [];

  if (node.absoluteBoundingBox) {
    const { width, height } = node.absoluteBoundingBox;

    // Width
    const wClosest = findClosest(width, Object.keys(SPACING_SCALE).map(Number));
    if (SPACING_SCALE[wClosest] && Math.abs(width - wClosest) < 2) {
      classes.push(`w-${SPACING_SCALE[wClosest]}`);
    }

    // Height
    const hClosest = findClosest(
      height,
      Object.keys(SPACING_SCALE).map(Number)
    );
    if (SPACING_SCALE[hClosest] && Math.abs(height - hClosest) < 2) {
      classes.push(`h-${SPACING_SCALE[hClosest]}`);
    }
  }

  return classes;
}

export function getColorClasses(node: Node): string[] {
  const classes: string[] = [];

  // Background
  if (node.fills && Array.isArray(node.fills) && node.fills.length > 0) {
    const fill = node.fills[0];
    if (fill.type === "SOLID" && fill.color) {
      const rgb = colorToRGB(fill.color);
      const rgbStr = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;

      if (TAILWIND_COLORS.has(rgbStr)) {
        const colorName = TAILWIND_COLORS.get(rgbStr)!;
        if (rgb.a < 1) {
          const opacity = Math.round(rgb.a * 100);
          classes.push(`bg-${colorName}/${opacity}`);
        } else {
          classes.push(`bg-${colorName}`);
        }
      }
    }
  }

  // Border
  if (node.strokes && Array.isArray(node.strokes) && node.strokes.length > 0) {
    const stroke = node.strokes[0];
    if (stroke.type === "SOLID" && stroke.color) {
      const rgb = colorToRGB(stroke.color);
      const rgbStr = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;

      if (TAILWIND_COLORS.has(rgbStr)) {
        classes.push(`border-${TAILWIND_COLORS.get(rgbStr)}`);
      }
    }

    if (node.strokeWeight) {
      const weightMap: Record<number, string> = {
        0: "border-0",
        1: "border",
        2: "border-2",
        4: "border-4",
        8: "border-8",
      };
      const closest = findClosest(
        node.strokeWeight,
        Object.keys(weightMap).map(Number)
      );
      if (weightMap[closest]) {
        classes.push(weightMap[closest]);
      }
    }
  }

  return classes;
}

export function getSpacingClasses(node: Node): string[] {
  const classes: string[] = [];

  // Padding
  if (
    node.paddingLeft ||
    node.paddingRight ||
    node.paddingTop ||
    node.paddingBottom
  ) {
    const p = {
      left: node.paddingLeft || 0,
      right: node.paddingRight || 0,
      top: node.paddingTop || 0,
      bottom: node.paddingBottom || 0,
    };

    // All sides equal
    if (p.left === p.right && p.top === p.bottom && p.left === p.top) {
      const closest = findClosest(
        p.left,
        Object.keys(SPACING_SCALE).map(Number)
      );
      if (SPACING_SCALE[closest]) {
        classes.push(`p-${SPACING_SCALE[closest]}`);
      }
    } else {
      // Horizontal
      if (p.left === p.right) {
        const closest = findClosest(
          p.left,
          Object.keys(SPACING_SCALE).map(Number)
        );
        if (SPACING_SCALE[closest])
          classes.push(`px-${SPACING_SCALE[closest]}`);
      }
      // Vertical
      if (p.top === p.bottom) {
        const closest = findClosest(
          p.top,
          Object.keys(SPACING_SCALE).map(Number)
        );
        if (SPACING_SCALE[closest])
          classes.push(`py-${SPACING_SCALE[closest]}`);
      }
    }
  }

  return classes;
}

export function getEffectClasses(node: Node): string[] {
  const classes: string[] = [];

  // Border radius
  if (node.cornerRadius) {
    const closest = findClosest(
      node.cornerRadius,
      Object.keys(BORDER_RADIUS_SCALE).map(Number)
    );
    if (BORDER_RADIUS_SCALE[closest]) {
      classes.push(BORDER_RADIUS_SCALE[closest]);
    }
  }

  // Opacity
  if (node.opacity !== undefined && node.opacity < 1) {
    const opacityValue = Math.round(node.opacity * 100);
    const opacityMap: Record<number, string> = {
      0: "opacity-0",
      10: "opacity-10",
      20: "opacity-20",
      25: "opacity-25",
      30: "opacity-30",
      40: "opacity-40",
      50: "opacity-50",
      60: "opacity-60",
      70: "opacity-70",
      75: "opacity-75",
      80: "opacity-80",
      90: "opacity-90",
      95: "opacity-95",
    };
    const closest = findClosest(
      opacityValue,
      Object.keys(opacityMap).map(Number)
    );
    if (opacityMap[closest]) {
      classes.push(opacityMap[closest]);
    }
  }

  // Shadow
  if (node.effects && Array.isArray(node.effects)) {
    const shadows = node.effects.filter(
      (e) => e.type === "DROP_SHADOW" && e.visible
    );
    if (shadows.length > 0) {
      // Simple shadow mapping
      classes.push("shadow-md");
    }
  }

  return classes;
}

export function getTextClasses(node: Node): string[] {
  const classes: string[] = [];

  if (node.type === "TEXT" && node.style) {
    // Font size
    if (node.style.fontSize) {
      const closest = findClosest(
        node.style.fontSize,
        Object.keys(FONT_SIZE_SCALE).map(Number)
      );
      if (FONT_SIZE_SCALE[closest]) {
        classes.push(FONT_SIZE_SCALE[closest]);
      }
    }

    // Font weight
    if (node.style.fontWeight) {
      if (FONT_WEIGHT_SCALE[node.style.fontWeight]) {
        classes.push(FONT_WEIGHT_SCALE[node.style.fontWeight]);
      }
    }

    // Text align
    const alignMap: Record<string, string> = {
      LEFT: "text-left",
      CENTER: "text-center",
      RIGHT: "text-right",
      JUSTIFIED: "text-justify",
    };
    if (
      node.style.textAlignHorizontal &&
      alignMap[node.style.textAlignHorizontal]
    ) {
      classes.push(alignMap[node.style.textAlignHorizontal]);
    }
  }

  // Text color
  if (node.fills && Array.isArray(node.fills) && node.fills.length > 0) {
    const fill = node.fills[0];
    if (fill.type === "SOLID" && fill.color) {
      const rgb = colorToRGB(fill.color);
      const rgbStr = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;

      if (TAILWIND_COLORS.has(rgbStr)) {
        classes.push(`text-${TAILWIND_COLORS.get(rgbStr)}`);
      }
    }
  }

  return classes;
}

export function nodeToTailwindClasses(node: Node): string[] {
  return [
    ...getLayoutClasses(node),
    ...getSizeClasses(node),
    ...getColorClasses(node),
    ...getSpacingClasses(node),
    ...getEffectClasses(node),
    ...getTextClasses(node),
  ].filter(Boolean);
}

export function getInlineStyles(node: Node): Record<string, string | number> {
  const styles: Record<string, string | number> = {};

  // Only add styles that can't be represented with Tailwind
  if (node.absoluteBoundingBox) {
    const { width, height } = node.absoluteBoundingBox;

    // Check if size is not in standard scale
    const wClosest = findClosest(width, Object.keys(SPACING_SCALE).map(Number));
    if (Math.abs(width - wClosest) >= 2) {
      styles.width = `${width}px`;
    }

    const hClosest = findClosest(
      height,
      Object.keys(SPACING_SCALE).map(Number)
    );
    if (Math.abs(height - hClosest) >= 2) {
      styles.height = `${height}px`;
    }
  }

  // Custom colors
  if (node.fills && Array.isArray(node.fills) && node.fills.length > 0) {
    const fill = node.fills[0];
    if (fill.type === "SOLID" && fill.color) {
      const rgb = colorToRGB(fill.color);
      const rgbStr = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;

      if (!TAILWIND_COLORS.has(rgbStr)) {
        styles.backgroundColor = rgbToString(rgb);
      }
    } else if (fill.type === "GRADIENT_LINEAR" && fill.gradientStops) {
      const stops = fill.gradientStops
        .map((stop) => {
          const color = rgbToString(colorToRGB(stop.color));
          return `${color} ${stop.position * 100}%`;
        })
        .join(", ");
      styles.background = `linear-gradient(${stops})`;
    }
  }

  // Custom shadows
  if (node.effects && Array.isArray(node.effects)) {
    const shadows = node.effects
      .filter((e) => e.type === "DROP_SHADOW" && e.visible)
      .map((shadow) => {
        const color = shadow.color
          ? rgbToString(colorToRGB(shadow.color))
          : "rgba(0, 0, 0, 0.1)";
        const x = shadow.offset?.x || 0;
        const y = shadow.offset?.y || 0;
        const blur = shadow.radius || 0;
        return `${x}px ${y}px ${blur}px ${color}`;
      });

    if (shadows.length > 0) {
      styles.boxShadow = shadows.join(", ");
    }
  }

  return styles;
}
