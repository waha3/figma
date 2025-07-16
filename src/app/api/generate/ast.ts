import {
  type JSXElement,
  type JSXOpeningElement,
  type JSXClosingElement,
  type JSXAttribute,
  type JSXAttributeOrSpread,
  type JSXExpressionContainer,
  type StringLiteral,
  type Identifier,
  type ObjectExpression,
  type KeyValueProperty,
  type ImportDeclaration,
  type Module,
} from "@swc/core";

export const identifier = (value: string): Identifier => ({
  type: "Identifier",
  optional: false,
  value,
  span: { start: 0, end: 0, ctxt: 0 },
});

export const stringLiteral = (value: string): StringLiteral => ({
  type: "StringLiteral",
  value,
  span: { start: 0, end: 0, ctxt: 0 },
});

export const jsxOpeningElement = (
  value: string,
  attrs: JSXAttributeOrSpread[] = [],
  selfClosing = false
): JSXOpeningElement => ({
  type: "JSXOpeningElement",
  name: identifier(value),
  attributes: attrs,
  selfClosing,
  span: { start: 0, end: 0, ctxt: 0 },
});

export const jsxClosingElement = (value: string): JSXClosingElement => ({
  type: "JSXClosingElement",
  name: identifier(value),
  span: { start: 0, end: 0, ctxt: 0 },
});

export const jsxAttribute = (
  name: string,
  value: StringLiteral | JSXExpressionContainer
): JSXAttribute => ({
  type: "JSXAttribute",
  name: identifier(name),
  value,
  span: { start: 0, end: 0, ctxt: 0 },
});

export const jsxText = (
  value: string
): {
  type: "JSXText";
  value: string;
  raw: string;
  span: { start: number; end: number; ctxt: number };
} => ({
  type: "JSXText",
  value,
  raw: value,
  span: { start: 0, end: 0, ctxt: 0 },
});

export const objectExpression = (
  props: KeyValueProperty[]
): ObjectExpression => ({
  type: "ObjectExpression",
  properties: props,
  span: { start: 0, end: 0, ctxt: 0 },
});

export const keyValueProperty = (
  key: string,
  value: string
): KeyValueProperty => ({
  type: "KeyValueProperty",
  key: identifier(key),
  value: stringLiteral(value),
  // span 字段移除，swc/core KeyValueProperty 不支持
});

export const jsxExpressionContainer = (
  expr: ObjectExpression
): JSXExpressionContainer => ({
  type: "JSXExpressionContainer",
  expression: expr,
  span: { start: 0, end: 0, ctxt: 0 },
});

export const importDeclaration = (
  local: string,
  source: string
): ImportDeclaration => ({
  type: "ImportDeclaration",
  specifiers: [
    {
      type: "ImportDefaultSpecifier",
      local: identifier(local),
      span: { start: 0, end: 0, ctxt: 0 },
    },
  ],
  source: stringLiteral(source),
  typeOnly: false,
  span: { start: 0, end: 0, ctxt: 0 },
});

export const jsxElement = (
  tag: string,
  attrs: JSXAttributeOrSpread[] = [],
  children: JSXElement[] = []
): JSXElement => ({
  type: "JSXElement",
  opening: jsxOpeningElement(tag, attrs, false),
  closing: jsxClosingElement(tag),
  children,
  span: { start: 0, end: 0, ctxt: 0 },
});

export const moduleAst = (
  body: Array<
    | ImportDeclaration
    | {
        type: "ExpressionStatement";
        expression: JSXElement;
        span: { start: number; end: number; ctxt: number };
      }
  >
): Module => ({
  type: "Module",
  body,
  span: { start: 0, end: 0, ctxt: 0 },
  interpreter: "",
});
