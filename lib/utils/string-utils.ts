export function sanitizeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9]/g, "");
}

export function toPascalCase(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9]/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("");
}

export function generateComponentName(
  nodeName: string,
  nodeId: string
): string {
  const cleaned = toPascalCase(nodeName);
  return cleaned || `Component${nodeId.replace(/[:-]/g, "")}`;
}
