import { type Node } from "@figma/rest-api-spec";
import { NextResponse, type NextRequest } from "next/server";
import fs from "node:fs";
import qs from "node:querystring";
import prettier from "prettier";
import getConfig from "next/config";
import { type JSXElement, type ImportDeclaration } from "@swc/core";
import {
  jsxOpeningElement,
  jsxClosingElement,
  jsxAttribute,
  stringLiteral,
  jsxText,
  objectExpression,
  keyValueProperty,
  jsxExpressionContainer,
  importDeclaration,
  jsxElement,
  moduleAst,
} from "./ast";
import { getTailwindcssRuleClassNameAndStyle } from "./tailwindcss";
import { print } from "@swc/core";
import path from "path";

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

/**
 * 下载 Figma IMAGE_FILL 图片到本地 public/figma_images/hash.png
 * 返回 hash -> 相对路径（/figma_images/hash.png）映射
 */
async function downloadFigmaImages({
  fileKey,
  accessToken,
  nodes,
}: {
  fileKey: string;
  accessToken: string;
  nodes: Node[];
}) {
  // 1. 收集所有 imageRef
  const imageRefs: string[] = [];
  const nodeIdToImageRef: Record<string, string> = {};
  nodes.forEach((node) => {
    if ("fills" in node && Array.isArray(node.fills)) {
      const imageFill = node.fills.find(
        (f): f is import("@figma/rest-api-spec").ImagePaint =>
          f &&
          f.type === "IMAGE" &&
          typeof (f as import("@figma/rest-api-spec").ImagePaint).imageRef ===
            "string"
      );
      if (imageFill && "id" in node && typeof node.id === "string") {
        imageRefs.push(imageFill.imageRef);
        nodeIdToImageRef[node.id] = imageFill.imageRef;
      }
    }
  });
  if (imageRefs.length === 0) return {};

  // 2. 请求 Figma /images API 获取 hash->url
  const url = `https://api.figma.com/v1/images/${fileKey}?ids=${Object.keys(nodeIdToImageRef).join(",")}`;
  const res = await fetch(url, {
    headers: { "X-FIGMA-TOKEN": accessToken },
  });
  const data = await res.json();
  const hashToUrl: Record<string, string> = data.images || {};

  // 3. 下载图片并保存到 public/figma_images/hash.png
  const publicDir = path.join(process.cwd(), "public", "figma_images");
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
  const hashToPath: Record<string, string> = {};
  for (const [nodeId, hashUrl] of Object.entries(hashToUrl)) {
    if (!hashUrl) continue;
    const hash = nodeIdToImageRef[nodeId];
    const ext = hashUrl.includes(".jpg") ? "jpg" : "png";
    const fileName = `${hash}.${ext}`;
    const filePath = path.join(publicDir, fileName);
    const relPath = `/figma_images/${fileName}`;
    // 下载图片
    const imgRes = await fetch(hashUrl);
    const arrayBuffer = await imgRes.arrayBuffer();
    fs.writeFileSync(filePath, Buffer.from(arrayBuffer));
    hashToPath[hash] = relPath;
  }
  return hashToPath;
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

function nodeToJsxElement(
  node: Node,
  hashToPath: Record<string, string> = {}
): JSXElement {
  let tag = "div";
  let children: JSXElement[] = [];
  let textContent: string | undefined = undefined;

  // 检查图片 fill
  let imageUrl: string | undefined = undefined;
  if ("fills" in node && Array.isArray(node.fills)) {
    const imageFill = node.fills.find(
      (f): f is import("@figma/rest-api-spec").ImagePaint =>
        f &&
        f.type === "IMAGE" &&
        typeof (f as import("@figma/rest-api-spec").ImagePaint).imageRef ===
          "string"
    );
    if (
      imageFill &&
      "id" in node &&
      typeof node.id === "string" &&
      imageFill.imageRef in hashToPath
    ) {
      imageUrl = hashToPath[imageFill.imageRef];
      tag = "Image";
    }
  }

  // 选择标签类型
  if (node.type === "TEXT") {
    tag = "span";
    if ("characters" in node) {
      textContent = node.characters as string;
    }
  } else if (node.type === "RECTANGLE") {
    tag = "div";
  } else if (node.type === "FRAME" || node.type === "GROUP") {
    tag = "div";
  } else if (node.type === "VECTOR") {
    tag = "svg";
    // 还原 vector 路径
    let pathData = "";
    if (
      "fillGeometry" in node &&
      Array.isArray(node.fillGeometry) &&
      node.fillGeometry.length > 0
    ) {
      pathData = node.fillGeometry
        .map((g: { path: string }) => g.path)
        .join(" ");
    } else if (
      "strokeGeometry" in node &&
      Array.isArray(node.strokeGeometry) &&
      node.strokeGeometry.length > 0
    ) {
      pathData = node.strokeGeometry
        .map((g: { path: string }) => g.path)
        .join(" ");
    }
    if (pathData) {
      children.push(
        jsxElement("path", [jsxAttribute("d", stringLiteral(pathData))], [])
      );
    }
  } else if (node.type === "ELLIPSE") {
    tag = "svg";
    if ("absoluteBoundingBox" in node && node.absoluteBoundingBox) {
      const { width, height } = node.absoluteBoundingBox;
      children.push(
        jsxElement(
          "ellipse",
          [
            jsxAttribute("cx", stringLiteral(String(width / 2))),
            jsxAttribute("cy", stringLiteral(String(height / 2))),
            jsxAttribute("rx", stringLiteral(String(width / 2))),
            jsxAttribute("ry", stringLiteral(String(height / 2))),
          ],
          []
        )
      );
    }
  } else if (node.type === "LINE") {
    tag = "svg";
    if ("absoluteBoundingBox" in node && node.absoluteBoundingBox) {
      const { width, height } = node.absoluteBoundingBox;
      children.push(
        jsxElement(
          "line",
          [
            jsxAttribute("x1", stringLiteral("0")),
            jsxAttribute("y1", stringLiteral("0")),
            jsxAttribute("x2", stringLiteral(String(width))),
            jsxAttribute("y2", stringLiteral(String(height))),
          ],
          []
        )
      );
    }
  } else if (node.type === "REGULAR_POLYGON" || node.type === "STAR") {
    tag = "svg";
    let points = "";
    if (
      "fillGeometry" in node &&
      Array.isArray(node.fillGeometry) &&
      node.fillGeometry.length > 0
    ) {
      const path = node.fillGeometry[0].path as string;
      points =
        path
          .match(/[ML]\s*([\d.-]+)\s+([\d.-]+)/g)
          ?.map((cmd) => {
            const [, x, y] = cmd.match(/[ML]\s*([\d.-]+)\s+([\d.-]+)/) || [];
            return x && y ? `${x},${y}` : "";
          })
          .join(" ") || "";
    }
    if (points) {
      children.push(
        jsxElement(
          "polygon",
          [jsxAttribute("points", stringLiteral(points))],
          []
        )
      );
    }
  } else if (node.type === "INSTANCE" || node.type === "COMPONENT") {
    tag = "div";
  }

  // 递归 children
  if ("children" in node && Array.isArray(node.children)) {
    children = node.children.map((child) =>
      nodeToJsxElement(child, hashToPath)
    );
  }

  // Tailwind class/style
  const { className, style } = getTailwindcssRuleClassNameAndStyle(node);

  // 构造 AST
  const opening = jsxOpeningElement(tag);
  if (imageUrl) {
    opening.attributes.push(jsxAttribute("src", stringLiteral(imageUrl)));
    if ("width" in node && typeof node.width === "number") {
      opening.attributes.push(
        jsxAttribute("width", stringLiteral(String(node.width)))
      );
    }
    if ("height" in node && typeof node.height === "number") {
      opening.attributes.push(
        jsxAttribute("height", stringLiteral(String(node.height)))
      );
    }
    opening.selfClosing = true;
  }
  if (className) {
    opening.attributes.push(
      jsxAttribute("className", stringLiteral(className))
    );
  }
  if (Object.keys(style).length > 0) {
    opening.attributes.push(
      jsxAttribute(
        "style",
        jsxExpressionContainer(
          objectExpression(
            Object.entries(style).map(([k, v]) =>
              keyValueProperty(k, String(v))
            )
          )
        )
      )
    );
  }

  return {
    type: "JSXElement",
    opening,
    closing: jsxClosingElement(tag),
    children: textContent ? [jsxText(textContent)] : children,
    span: { start: 0, end: 0, ctxt: 0 },
  };
}

function transformNodeToAst(
  nodes: Node[],
  hashToPath: Record<string, string> = {}
): JSXElement[] {
  return nodes.map((node) => nodeToJsxElement(node, hashToPath));
}

// 递归修正 AST 节点 span 字段，确保包含 ctxt: 0，并详细 debug 输出
function fixSpanCtct(node: unknown, path: string = "root") {
  if (Array.isArray(node)) {
    node.forEach((item, idx) => {
      console.log(
        `[fixSpanCtct] visiting array`,
        `${path}[${idx}]`,
        (item as Record<string, unknown>)?.type || typeof item
      );
      fixSpanCtct(item, `${path}[${idx}]`);
    });
    return;
  }
  if (node && typeof node === "object") {
    const obj = node as Record<string, unknown>;
    console.log(
      `[fixSpanCtct] visiting object`,
      path,
      obj?.type || typeof node
    );
    if ("span" in obj) {
      const span = obj["span"];
      if (!span || typeof span !== "object") {
        console.error(`[fixSpanCtct] span 字段缺失或类型错误`, { path, node });
        obj["span"] = { start: 0, end: 0, ctxt: 0 };
      } else {
        const s = span as { start?: number; end?: number; ctxt?: number };
        if (typeof s.ctxt !== "number") {
          console.error(`[fixSpanCtct] span.ctxt 缺失`, { path, node });
          s.ctxt = 0;
        }
        if (typeof s.start !== "number") {
          console.error(`[fixSpanCtct] span.start 缺失`, { path, node });
          s.start = 0;
        }
        if (typeof s.end !== "number") {
          console.error(`[fixSpanCtct] span.end 缺失`, { path, node });
          s.end = 0;
        }
      }
    }
    for (const key in obj) {
      if (typeof obj[key] === "object" && obj[key] !== null) {
        fixSpanCtct(obj[key], `${path}.${key}`);
      }
    }
  }
}

export async function POST(req: NextRequest) {
  const body: Values = await req.json();
  const isPatValid = await isFigmaPatValid(body.accessToken);
  if (!isPatValid) {
    return NextResponse.json({ message: "figma pat expired" }, { status: 500 });
  }

  const [fileNodes] = await Promise.all([getFigmaFileNodes(body)]);

  // 下载图片并获取 hash->本地路径映射
  const hashToPath = await downloadFigmaImages({
    fileKey: body.fileKey,
    accessToken: body.accessToken,
    nodes: fileNodes,
  });

  // 传递 hashToPath 给 AST 生成
  const astArr = transformNodeToAst(fileNodes, hashToPath);

  // 只取第一个根节点为例
  const rootAst = astArr[0];

  // 构造 import 语句 AST
  const importImageDecl: ImportDeclaration = importDeclaration(
    "Image",
    "next/image"
  );

  // 构造 swc 的文件 AST，import + jsx
  const fileAst = moduleAst([
    importImageDecl,
    {
      type: "ExpressionStatement",
      expression: rootAst,
      span: { start: 0, end: 0, ctxt: 0 },
    },
  ]);

  // 自动修正所有 AST 节点 span.ctxt
  // fixSpanCtct(fileAst);

  // print 前输出 AST 结构
  // console.log("fileAst before print", JSON.stringify(fileAst, null, 2));

  const staticPath = `${serverRuntimeConfig.figmaStatic}/figma`;

  fs.writeFileSync(`${staticPath}/ast.json`, JSON.stringify(fileAst));

  // 用 swc print 生成代码
  const { code } = await print(fileAst);
  // 用 prettier 格式化
  const formatted = await prettier.format(code, { parser: "babel" });

  return NextResponse.json({ jsx: formatted });
}
