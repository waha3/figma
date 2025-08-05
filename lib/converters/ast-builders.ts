import type { Node } from "@figma/rest-api-spec";
import type { Module, JSXElement, JSXAttribute } from "@swc/core";
import {
  createImportStatement,
  createComponentDeclaration,
  createDefaultExport,
  createElement,
  createTextElement,
  createAttribute,
  createStyleObject,
} from "../utils/swc-helpers";
import { nodeToTailwindClasses, getInlineStyles } from "./style-converters";

function getTagName(nodeType: string): string {
  const typeMap: Record<string, string> = {
    FRAME: "div",
    GROUP: "div",
    COMPONENT: "div",
    INSTANCE: "div",
    RECTANGLE: "div",
    ELLIPSE: "div",
    VECTOR: "svg",
    TEXT: "span",
    LINE: "div",
  };
  return typeMap[nodeType] || "div";
}

function nodeToJSXElement(node: Node): JSXElement {
  const tagName = getTagName(node.type);
  const attributes: JSXAttribute[] = [];

  // Add className
  const classes = nodeToTailwindClasses(node);
  if (classes.length > 0) {
    attributes.push(createAttribute("className", classes.join(" ")));
  }

  // Add inline styles
  const styles = getInlineStyles(node);
  if (Object.keys(styles).length > 0) {
    attributes.push(createAttribute("style", createStyleObject(styles)));
  }

  // Handle visibility
  if (node.visible === false) {
    attributes.push(createAttribute("hidden", null));
  }

  // Text node
  if (node.type === "TEXT" && node.characters) {
    return createTextElement(tagName, attributes, node.characters);
  }

  // Container node with children
  if (node.children && node.children.length > 0) {
    const children = node.children.map((child) => nodeToJSXElement(child));
    return createElement(tagName, attributes, children);
  }

  // Self-closing element
  return createElement(tagName, attributes, []);
}

export function createComponentAST(node: Node, componentName: string): Module {
  const jsxElement = nodeToJSXElement(node);

  return {
    type: "Module",
    body: [
      createImportStatement("react", "React"),
      createComponentDeclaration(componentName, jsxElement),
      createDefaultExport(componentName),
    ],
    span: { start: 0, end: 0, ctxt: 0 },
  };
}
