import type { Node } from "@figma/rest-api-spec";
import { createComponentAST } from "./ast-builders";
import { printAST } from "../utils/swc-helpers";
import { formatCode } from "../utils/formatter";

export async function figmaToJSX(
  node: Node,
  componentName: string
): Promise<string> {
  const ast = createComponentAST(node, componentName);
  const code = printAST(ast);
  return formatCode(code);
}
