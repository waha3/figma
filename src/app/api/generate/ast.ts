import {
  type JSXElement,
  type JSXOpeningElement,
  type JSXClosingElement,
  type Identifier,
} from "@swc/core";

const identifier = (value: string): Identifier => ({
  type: "Identifier",
  optional: true,
  value,
  span: {
    start: 0,
    end: 0,
    ctxt: 0,
  },
});

const jsxOpeningElement: JSXOpeningElement = {
  type: "JSXOpeningElement",
  name: identifier("div"),
  attributes: [],
  selfClosing: false,
  span: { start: 0, end: 0, ctxt: 0 },
};

const jsxClosingElement: JSXClosingElement = {
  type: "JSXClosingElement",
  name: ident(node.type),
  span: { start: 0, end: 0, ctxt: 0 },
};

const jsxElement: JSXElement = {
  type: "JSXElement",
  opening,
  closing,
  children: [],
  span: { start: 0, end: 0, ctxt: 0 },
};
