import { writeFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";

const OUTPUT_PATHS = {
  pc: "generated/pc/components",
  mobile: "generated/mobile/components",
  wechat: "generated/wechat/components",
} as const;

export function writeComponentFile(
  platform: keyof typeof OUTPUT_PATHS,
  filename: string,
  content: string
): void {
  const basePath = OUTPUT_PATHS[platform];
  const fullPath = join(process.cwd(), basePath, filename);

  // Ensure directory exists
  mkdirSync(dirname(fullPath), { recursive: true });

  // Write file
  writeFileSync(fullPath, content, "utf-8");
}

export function writeWechatComponent(
  componentName: string,
  files: { wxml: string; wxss: string; js: string; json: string }
): void {
  const basePath = join(
    process.cwd(),
    "generated/wechat/components",
    componentName.toLowerCase()
  );

  // Create component directory
  mkdirSync(basePath, { recursive: true });

  // Write all files
  writeFileSync(join(basePath, "index.wxml"), files.wxml, "utf-8");
  writeFileSync(join(basePath, "index.wxss"), files.wxss, "utf-8");
  writeFileSync(join(basePath, "index.js"), files.js, "utf-8");
  writeFileSync(join(basePath, "index.json"), files.json, "utf-8");
}
