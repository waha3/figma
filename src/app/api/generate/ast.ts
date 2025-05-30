import {
  type JSXElement,
  type JSXOpeningElement,
  type JSXClosingElement,
  type JSXAttributeOrSpread,
  type Identifier,
} from "@swc/core";

export const identifier = (value: string): Identifier => ({
  type: "Identifier",
  optional: false,
  value,
  span: {
    start: 0,
    end: 0,
    ctxt: 0,
  },
});

export const jsxOpeningElement = (value: string): JSXOpeningElement => {
  return {
    type: "JSXOpeningElement",
    name: identifier(value),
    attributes: [],
    selfClosing: false,
    span: { start: 0, end: 0, ctxt: 0 },
  };
};

export const jsxClosingElement = (value: string): JSXClosingElement => {
  return {
    type: "JSXClosingElement",
    name: identifier(value),
    span: { start: 0, end: 0, ctxt: 0 },
  };
};

export const jsxElement: JSXElement = {
  type: "JSXElement",
  opening: jsxOpeningElement("div"),
  closing: jsxClosingElement("div"),
  children: [],
  span: { start: 0, end: 0, ctxt: 0 },
};
