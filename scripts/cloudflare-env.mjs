/** OpenNext copies dotenv files into its Worker. Keep only explicitly public
 * variables there; private credentials must come from runtime bindings. */
export function publicWorkerEnvironment(source) {
  const modes = new Map();
  for (const match of source.matchAll(
    /^export const (production|development|test) = (.+);$/gm,
  )) {
    const values = JSON.parse(match[2]);
    if (!values || Array.isArray(values) || typeof values !== "object")
      throw new Error("Unexpected OpenNext environment format.");
    modes.set(
      match[1],
      Object.fromEntries(
        Object.entries(values).filter(([key]) =>
          key.startsWith("NEXT_PUBLIC_"),
        ),
      ),
    );
  }
  if (modes.size !== 3)
    throw new Error(
      "OpenNext environment format changed; refusing to retain private build values.",
    );
  return ["production", "development", "test"]
    .map(
      (mode) =>
        "export const " +
        mode +
        " = " +
        JSON.stringify(modes.get(mode)) +
        ";\n",
    )
    .join("");
}
