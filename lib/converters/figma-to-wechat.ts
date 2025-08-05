import type { Node } from "@figma/rest-api-spec";
import { colorToCSS } from "../utils/color-utils";

function nodeToWechatStyles(node: Node): string[] {
  const styles: string[] = [];

  // Layout
  if (node.layoutMode === "HORIZONTAL") {
    styles.push("display: flex", "flex-direction: row");
  } else if (node.layoutMode === "VERTICAL") {
    styles.push("display: flex", "flex-direction: column");
  }

  const alignMap: Record<string, string> = {
    MIN: "flex-start",
    CENTER: "center",
    MAX: "flex-end",
    SPACE_BETWEEN: "space-between",
    SPACE_AROUND: "space-around",
  };

  if (node.primaryAxisAlignItems) {
    styles.push(
      `justify-content: ${alignMap[node.primaryAxisAlignItems] || "flex-start"}`
    );
  }

  if (node.counterAxisAlignItems) {
    styles.push(
      `align-items: ${alignMap[node.counterAxisAlignItems] || "flex-start"}`
    );
  }

  // Size
  if (node.absoluteBoundingBox) {
    styles.push(`width: ${node.absoluteBoundingBox.width}rpx`);
    styles.push(`height: ${node.absoluteBoundingBox.height}rpx`);
  }

  // Padding
  if (
    node.paddingLeft ||
    node.paddingRight ||
    node.paddingTop ||
    node.paddingBottom
  ) {
    const p = [
      node.paddingTop || 0,
      node.paddingRight || 0,
      node.paddingBottom || 0,
      node.paddingLeft || 0,
    ];
    styles.push(`padding: ${p.map((v) => `${v}rpx`).join(" ")}`);
  }

  // Background
  if (node.fills && Array.isArray(node.fills) && node.fills.length > 0) {
    const fill = node.fills[0];
    if (fill.type === "SOLID" && fill.color) {
      styles.push(`background-color: ${colorToCSS(fill.color)}`);
    }
  }

  // Border
  if (
    node.strokes &&
    Array.isArray(node.strokes) &&
    node.strokes.length > 0 &&
    node.strokeWeight
  ) {
    const stroke = node.strokes[0];
    if (stroke.type === "SOLID" && stroke.color) {
      styles.push(
        `border: ${node.strokeWeight}rpx solid ${colorToCSS(stroke.color)}`
      );
    }
  }

  // Border radius
  if (node.cornerRadius) {
    styles.push(`border-radius: ${node.cornerRadius}rpx`);
  }

  // Text styles
  if (node.type === "TEXT") {
    if (node.style?.fontSize)
      styles.push(`font-size: ${node.style.fontSize}rpx`);
    if (node.style?.fontWeight)
      styles.push(`font-weight: ${node.style.fontWeight}`);

    const textAlignMap: Record<string, string> = {
      LEFT: "left",
      CENTER: "center",
      RIGHT: "right",
    };
    if (node.style?.textAlignHorizontal) {
      styles.push(
        `text-align: ${textAlignMap[node.style.textAlignHorizontal] || "left"}`
      );
    }

    if (node.fills && Array.isArray(node.fills) && node.fills.length > 0) {
      const fill = node.fills[0];
      if (fill.type === "SOLID" && fill.color) {
        styles.push(`color: ${colorToCSS(fill.color)}`);
      }
    }
  }

  // Opacity
  if (node.opacity !== undefined && node.opacity < 1) {
    styles.push(`opacity: ${node.opacity}`);
  }

  return styles;
}

function getTagName(nodeType: string): string {
  return nodeType === "TEXT" ? "text" : "view";
}

export async function figmaToWechat(
  node: Node,
  componentName: string
): Promise<string> {
  let wxmlContent = "";
  let wxssContent = "";
  let classIndex = 0;

  function processNode(n: Node, indent: string = ""): string {
    const tag = getTagName(n.type);
    const className = `${componentName.toLowerCase()}-${classIndex++}`;
    const styles = nodeToWechatStyles(n);

    if (styles.length > 0) {
      wxssContent += `.${className} {\n${styles.map((s) => `  ${s};`).join("\n")}\n}\n\n`;
    }

    if (n.type === "TEXT" && n.characters) {
      return `${indent}<${tag} class="${className}">${n.characters}</${tag}>`;
    }

    if (n.children && n.children.length > 0) {
      const children = n.children
        .map((child) => processNode(child, indent + "  "))
        .join("\n");
      return `${indent}<${tag} class="${className}">\n${children}\n${indent}</${tag}>`;
    }

    return `${indent}<${tag} class="${className}" />`;
  }

  wxmlContent = processNode(node);

  const jsContent = `Component({
  properties: {},
  data: {},
  methods: {}
});`;

  const jsonContent = `{
  "component": true,
  "usingComponents": {}
}`;

  return JSON.stringify({
    wxml: wxmlContent,
    wxss: wxssContent,
    js: jsContent,
    json: jsonContent,
  });
}
