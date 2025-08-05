import type {
  Span,
  Module,
  ImportDeclaration,
  VariableDeclaration,
  ExportDefaultDeclaration,
  JSXElement,
  JSXAttribute,
  JSXOpeningElement,
  JSXClosingElement,
  Expression,
  ObjectExpression,
} from "@swc/core";
import { printSync } from "@swc/core";

export const createSpan = (): Span => ({ start: 0, end: 0, ctxt: 0 });

export function createImportStatement(
  source: string,
  defaultImport: string
): ImportDeclaration {
  return {
    type: "ImportDeclaration",
    specifiers: [
      {
        type: "ImportDefaultSpecifier",
        local: { type: "Identifier", value: defaultImport, span: createSpan() },
        span: createSpan(),
      },
    ],
    source: {
      type: "StringLiteral",
      value: source,
      span: createSpan(),
    },
    typeOnly: false,
    span: createSpan(),
  };
}

export function createComponentDeclaration(
  name: string,
  body: JSXElement
): VariableDeclaration {
  return {
    type: "VariableDeclaration",
    kind: "const",
    declare: false,
    declarations: [
      {
        type: "VariableDeclarator",
        id: {
          type: "Identifier",
          value: name,
          optional: false,
          span: createSpan(),
        },
        init: {
          type: "ArrowFunctionExpression",
          params: [],
          body: {
            type: "BlockStatement",
            stmts: [
              {
                type: "ReturnStatement",
                argument: body,
                span: createSpan(),
              },
            ],
            span: createSpan(),
          },
          async: false,
          generator: false,
          span: createSpan(),
        },
        definite: false,
        span: createSpan(),
      },
    ],
    span: createSpan(),
  };
}

export function createDefaultExport(name: string): ExportDefaultDeclaration {
  return {
    type: "ExportDefaultDeclaration",
    decl: {
      type: "Identifier",
      value: name,
      optional: false,
      span: createSpan(),
    },
    span: createSpan(),
  };
}

export function createElement(
  tagName: string,
  attributes: JSXAttribute[],
  children: JSXElement[]
): JSXElement {
  return {
    type: "JSXElement",
    opening: {
      type: "JSXOpeningElement",
      name: {
        type: "Identifier",
        value: tagName,
        optional: false,
        span: createSpan(),
      },
      attrs: attributes,
      selfClosing: children.length === 0,
      span: createSpan(),
    },
    closing:
      children.length > 0
        ? {
            type: "JSXClosingElement",
            name: {
              type: "Identifier",
              value: tagName,
              optional: false,
              span: createSpan(),
            },
            span: createSpan(),
          }
        : null,
    children,
    span: createSpan(),
  };
}

export function createTextElement(
  tagName: string,
  attributes: JSXAttribute[],
  text: string
): JSXElement {
  return {
    type: "JSXElement",
    opening: {
      type: "JSXOpeningElement",
      name: {
        type: "Identifier",
        value: tagName,
        optional: false,
        span: createSpan(),
      },
      attrs: attributes,
      selfClosing: false,
      span: createSpan(),
    },
    closing: {
      type: "JSXClosingElement",
      name: {
        type: "Identifier",
        value: tagName,
        optional: false,
        span: createSpan(),
      },
      span: createSpan(),
    },
    children: [
      {
        type: "JSXText",
        value: text,
        span: createSpan(),
      },
    ],
    span: createSpan(),
  };
}

export function createAttribute(
  name: string,
  value: string | Expression | null
): JSXAttribute {
  return {
    type: "JSXAttribute",
    name: {
      type: "Identifier",
      value: name,
      optional: false,
      span: createSpan(),
    },
    value:
      value === null
        ? null
        : typeof value === "string"
          ? { type: "StringLiteral", value, span: createSpan() }
          : {
              type: "JSXExpressionContainer",
              expression: value,
              span: createSpan(),
            },
    span: createSpan(),
  };
}

export function createStyleObject(
  styles: Record<string, string | number>
): ObjectExpression {
  return {
    type: "ObjectExpression",
    properties: Object.entries(styles).map(([key, value]) => ({
      type: "Property",
      key: {
        type: "Identifier",
        value: key,
        optional: false,
        span: createSpan(),
      },
      value:
        typeof value === "number"
          ? { type: "NumericLiteral", value, span: createSpan() }
          : { type: "StringLiteral", value, span: createSpan() },
      span: createSpan(),
    })),
    span: createSpan(),
  };
}

export function printAST(ast: Module): string {
  const { code } = printSync(ast, {
    minify: false,
    jsc: {
      target: "es2020",
      parser: {
        syntax: "ecmascript",
        jsx: true,
      },
    },
  });
  return code;
}
