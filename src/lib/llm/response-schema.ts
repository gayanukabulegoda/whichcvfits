import { z } from "zod";
import { providerResultSchema } from "../contracts.ts";
import type { AIProviderId } from "./catalog.ts";

// Providers implement different JSON Schema subsets. Wire constraints are
// translated to descriptions where necessary; Zod still enforces every bound
// locally before any result can be scored or saved.
export function responseSchemaFor(
  provider: AIProviderId,
): Record<string, unknown> {
  const schema = z.toJSONSchema(providerResultSchema) as Record<
    string,
    unknown
  >;
  delete schema.$schema;
  function visit(value: unknown): void {
    if (!value || typeof value !== "object") return;
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    const node = value as Record<string, unknown>;
    const hints: string[] = [];
    const unsupported =
      provider === "anthropic"
        ? [
            "minimum",
            "maximum",
            "exclusiveMinimum",
            "exclusiveMaximum",
            "multipleOf",
            "minLength",
            "maxLength",
            "maxItems",
            "uniqueItems",
          ]
        : provider === "google"
          ? [
              "minLength",
              "maxLength",
              "multipleOf",
              "exclusiveMinimum",
              "exclusiveMaximum",
              "uniqueItems",
            ]
          : [];
    for (const key of unsupported)
      if (key in node) {
        hints.push(key + " " + String(node[key]));
        delete node[key];
      }
    if (
      provider === "anthropic" &&
      typeof node.minItems === "number" &&
      node.minItems > 1
    ) {
      hints.push("minItems " + node.minItems);
      delete node.minItems;
    }
    if (hints.length)
      node.description = [
        node.description,
        "Required local validation: " + hints.join("; ") + ".",
      ]
        .filter(Boolean)
        .join(" ");
    if (node.properties && typeof node.properties === "object")
      Object.values(node.properties).forEach(visit);
    if (node.$defs && typeof node.$defs === "object")
      Object.values(node.$defs).forEach(visit);
    for (const key of ["items", "anyOf", "allOf", "oneOf", "prefixItems"])
      visit(node[key]);
  }
  visit(schema);
  return schema;
}
