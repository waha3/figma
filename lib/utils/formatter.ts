import prettier from "prettier";

export async function formatCode(
  code: string,
  parser: string = "babel-ts"
): Promise<string> {
  try {
    const formatted = await prettier.format(code, {
      parser,
      semi: true,
      singleQuote: true,
      tabWidth: 2,
      trailingComma: "es5",
      printWidth: 100,
    });
    return formatted;
  } catch (error) {
    console.error("Prettier formatting error:", error);
    return code;
  }
}
