import { type Node } from "@figma/rest-api-spec";
import { NextResponse, type NextRequest } from "next/server";
import fs from "node:fs";
import qs from "node:querystring";
import prettier from "prettier";
import getConfig from "next/config";
import {
  type JSXElement,
  type JSXOpeningElement,
  type JSXClosingElement,
  type Identifier,
} from "@swc/core";

type Values = {
  accessToken: string;
  fileKey: string;
  nodeIds?: string;
};

const { serverRuntimeConfig } = getConfig();

async function isFigmaPatValid(
  accessToken: Values["accessToken"]
): Promise<boolean> {
  const res = await fetch("https://api.figma.com/v1/me", {
    headers: { "X-Figma-Token": accessToken },
  });
  return res.status === 200;
}

async function getFigmaFileNodes({
  fileKey,
  accessToken,
  nodeIds,
}: Values): Promise<Node[]> {
  const query = qs.stringify({
    ids: nodeIds,
    geometry: "paths",
  });
  const url = `https://api.figma.com/v1/files/${fileKey}/nodes?${query}`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "X-FIGMA-TOKEN": accessToken,
    },
  });
  const document = await res.json();
  const staticPath = `${serverRuntimeConfig.figmaStatic}/figma`;

  const formatedData = await prettier.format(JSON.stringify(document), {
    parser: "json",
  });

  if (fs.existsSync(staticPath)) {
    fs.mkdirSync(staticPath, {
      recursive: true,
    });
    fs.writeFileSync(`${staticPath}/nodes.json`, formatedData);
  }
  const nodes: Node[] = [];
  for (const key in document.nodes) {
    nodes.push(document.nodes[key].document);
  }
  return nodes;
}

async function getImagesInFile({
  fileKey,
  accessToken,
  nodeIds,
}: Values): Promise<Record<string, string>> {
  const query = qs.stringify({
    ids: nodeIds,
  });
  const res = await fetch(
    `https://api.figma.com/v1/files/${fileKey}/images?${query}`,
    {
      method: "GET",
      headers: {
        "X-FIGMA-TOKEN": accessToken,
      },
    }
  );
  const data = await res.json();
  return data.meta.images;
}

type NodeOf<K extends Node["type"]> = Extract<Node, { type: K }>;

type NodeHandler<N extends Node> = (node: N, parent: Node | null) => void;

export type Visitor = {
  All?: {
    enter?: NodeHandler<Node>;
    exit?: NodeHandler<Node>;
  };
} & {
  [K in Node["type"]]?: {
    enter?: NodeHandler<NodeOf<K>>;
    exit?: NodeHandler<NodeOf<K>>;
  };
};

function traverseNode<N extends Node>(
  node: N,
  parentNode: Node | null,
  visitor: Visitor
): void {
  const specific = visitor[node.type] as
    | { enter?: NodeHandler<N>; exit?: NodeHandler<N> }
    | undefined;

  specific?.enter?.(node, parentNode);
  visitor.All?.enter?.(node, parentNode);

  if ("children" in node && Array.isArray(node.children)) {
    for (const child of node.children) {
      traverseNode(child, node, visitor);
    }
  }

  specific?.exit?.(node, parentNode);
  visitor.All?.exit?.(node, parentNode);
}

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

function transformNodeToAst(nodes: Node[], ast: JSXElement[]): JSXElement[] {
  for (const node of nodes) {
    traverseNode(node, null, {
      FRAME: {
        enter(node, parentNode) {},
        exit(node, parentNode) {},
      },
    });
  }
  return ast;
}

export async function POST(req: NextRequest) {
  const body: Values = await req.json();
  const isPatValid = await isFigmaPatValid(body.accessToken);
  if (!isPatValid) {
    NextResponse.json({ message: "figma pat expired" }, { status: 500 });
  }

  const [fileNodes, images] = await Promise.all([
    getFigmaFileNodes(body),
    getImagesInFile(body),
  ]);
  console.log("nodes is ", fileNodes, images);
  transformNodeToAst(fileNodes, []);
}
