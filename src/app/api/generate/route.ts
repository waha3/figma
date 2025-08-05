import { NextRequest, NextResponse } from "next/server";
import { createFigmaClient } from "@/lib/figma-client";
import { generateComponentName } from "@/lib/utils/string-utils";
import { figmaToJSX } from "@/lib/converters/figma-to-jsx";
import { figmaToReactNative } from "@/lib/converters/figma-to-react-native";
import { figmaToWechat } from "@/lib/converters/figma-to-wechat";
import {
  writeComponentFile,
  writeWechatComponent,
} from "@/lib/utils/file-writer";

interface RequestBody {
  accessToken: string;
  fileKey: string;
  nodeIds?: string;
  platform: "pc" | "mobile" | "wechat";
}

interface ComponentResult {
  nodeId: string;
  name: string;
  filename: string;
  code: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as RequestBody;
    const { accessToken, fileKey, nodeIds, platform } = body;

    if (!accessToken || !fileKey || !platform) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required parameters",
          details: "accessToken, fileKey, and platform are required",
        },
        { status: 400 }
      );
    }

    const client = createFigmaClient(accessToken);
    const components: ComponentResult[] = [];

    // Parse node IDs
    const nodeIdList = nodeIds ? nodeIds.split(",").map((id) => id.trim()) : [];

    if (nodeIdList.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No node IDs provided",
          details: "Please provide at least one node ID",
        },
        { status: 400 }
      );
    }

    // Fetch nodes from Figma
    const nodesResponse = await client.getNodes(fileKey, nodeIdList);

    // Process each node
    for (const nodeId of nodeIdList) {
      try {
        const nodeData = nodesResponse.nodes[nodeId];
        if (!nodeData || !nodeData.document) {
          console.error(`Node ${nodeId} not found`);
          continue;
        }

        const node = nodeData.document;
        const componentName = generateComponentName(node.name, nodeId);
        const filename = componentName;

        let code = "";

        // Generate code based on platform
        switch (platform) {
          case "pc":
            code = await figmaToJSX(node, componentName);
            writeComponentFile("pc", `${filename}.tsx`, code);
            break;

          case "mobile":
            code = await figmaToReactNative(node, componentName);
            writeComponentFile("mobile", `${filename}.tsx`, code);
            break;

          case "wechat":
            const wechatResult = await figmaToWechat(node, componentName);
            const wechatFiles = JSON.parse(wechatResult);
            writeWechatComponent(componentName, wechatFiles);
            code = wechatResult;
            break;
        }

        components.push({
          nodeId,
          name: componentName,
          filename,
          code,
        });
      } catch (error) {
        console.error(`Error processing node ${nodeId}:`, error);
        components.push({
          nodeId,
          name: "Error",
          filename: "error",
          code: `// Error processing node ${nodeId}: ${error instanceof Error ? error.message : "Unknown error"}`,
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        components,
      },
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate components",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
