import type { Node } from "@figma/rest-api-spec";
import { colorToCSS } from "../utils/color-utils";

function nodeToReactNativeStyles(node: Node): Record<string, any> {
  const styles: Record<string, any> = {};

  // Layout
  if (node.layoutMode === "HORIZONTAL" || node.layoutMode === "VERTICAL") {
    styles.flexDirection = node.layoutMode === "HORIZONTAL" ? "row" : "column";

    const alignMap: Record<string, string> = {
      MIN: "flex-start",
      CENTER: "center",
      MAX: "flex-end",
      SPACE_BETWEEN: "space-between",
      SPACE_AROUND: "space-around",
      SPACE_EVENLY: "space-evenly",
    };

    if (node.primaryAxisAlignItems) {
      styles.justifyContent =
        alignMap[node.primaryAxisAlignItems] || "flex-start";
    }

    if (node.counterAxisAlignItems) {
      styles.alignItems = alignMap[node.counterAxisAlignItems] || "flex-start";
    }

    if (node.itemSpacing) {
      styles.gap = node.itemSpacing;
    }
  }

  // Size
  if (node.absoluteBoundingBox) {
    styles.width = node.absoluteBoundingBox.width;
    styles.height = node.absoluteBoundingBox.height;
  }

  // Padding
  if (node.paddingLeft) styles.paddingLeft = node.paddingLeft;
  if (node.paddingRight) styles.paddingRight = node.paddingRight;
  if (node.paddingTop) styles.paddingTop = node.paddingTop;
  if (node.paddingBottom) styles.paddingBottom = node.paddingBottom;

  // Background
  if (node.fills && Array.isArray(node.fills) && node.fills.length > 0) {
    const fill = node.fills[0];
    if (fill.type === "SOLID" && fill.color) {
      styles.backgroundColor = colorToCSS(fill.color);
    }
  }

  // Border
  if (node.strokes && Array.isArray(node.strokes) && node.strokes.length > 0) {
    const stroke = node.strokes[0];
    if (stroke.type === "SOLID" && stroke.color) {
      styles.borderColor = colorToCSS(stroke.color);
    }
  }

  if (node.strokeWeight) {
    styles.borderWidth = node.strokeWeight;
  }

  // Border radius
  if (node.cornerRadius) {
    styles.borderRadius = node.cornerRadius;
  }

  // Text styles
  if (node.type === "TEXT" && node.style) {
    if (node.style.fontSize) styles.fontSize = node.style.fontSize;
    if (node.style.fontWeight)
      styles.fontWeight = String(node.style.fontWeight);
    if (node.style.letterSpacing)
      styles.letterSpacing = node.style.letterSpacing;
    if (node.style.lineHeightPx) styles.lineHeight = node.style.lineHeightPx;

    const textAlignMap: Record<string, string> = {
      LEFT: "left",
      CENTER: "center",
      RIGHT: "right",
      JUSTIFIED: "justify",
    };
    if (node.style.textAlignHorizontal) {
      styles.textAlign = textAlignMap[node.style.textAlignHorizontal] || "left";
    }
  }

  // Text color
  if (
    node.type === "TEXT" &&
    node.fills &&
    Array.isArray(node.fills) &&
    node.fills.length > 0
  ) {
    const fill = node.fills[0];
    if (fill.type === "SOLID" && fill.color) {
      styles.color = colorToCSS(fill.color);
    }
  }

  // Opacity
  if (node.opacity !== undefined && node.opacity < 1) {
    styles.opacity = node.opacity;
  }

  return styles;
}

function getComponentName(nodeType: string): string {
  const componentMap: Record<string, string> = {
    FRAME: "View",
    GROUP: "View",
    COMPONENT: "View",
    INSTANCE: "View",
    RECTANGLE: "View",
    ELLIPSE: "View",
    VECTOR: "View",
    TEXT: "Text",
    LINE: "View",
  };
  return componentMap[nodeType] || "View";
}

export async function figmaToReactNative(
  node: Node,
  componentName: string
): Promise<string> {
  const imports = new Set(["React"]);
  const components = new Set<string>();

  function processNode(n: Node): string {
    const comp = getComponentName(n.type);
    components.add(comp);

    const styles = nodeToReactNativeStyles(n);
    const styleStr =
      Object.keys(styles).length > 0
        ? ` style={${JSON.stringify(styles)}}`
        : "";

    if (n.type === "TEXT" && n.characters) {
      return `<${comp}${styleStr}>${n.characters}</${comp}>`;
    }

    if (n.children && n.children.length > 0) {
      const children = n.children
        .map((child) => processNode(child))
        .join("\n      ");
      return `<${comp}${styleStr}>\n      ${children}\n    </${comp}>`;
    }

    return `<${comp}${styleStr} />`;
  }

  const jsx = processNode(node);

  const code = `import React from 'react';
import { ${Array.from(components).join(", ")} } from 'react-native';

const ${componentName} = () => {
  return (
    ${jsx}
  );
};

export default ${componentName};`;

  return code;
}
