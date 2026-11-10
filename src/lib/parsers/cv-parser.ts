import { parseDocx } from "./docx.ts";
import { LIMITS } from "../contracts.ts";
export function validateCvText(text: string): string {
  const value = text.replace(/\u0000/g, "").trim();
  if (value.length < 20 || !/\p{L}{2}/u.test(value) || /\uFFFD/.test(value))
    throw new Error(
      "No readable CV text was found. For scanned documents, paste the text instead.",
    );
  if (value.length > LIMITS.cvChars)
    throw new Error(
      "This CV exceeds 50,000 characters. Shorten it using the text editor.",
    );
  return value;
}
export async function parseCvFileBuffer(
  name: string,
  data: Uint8Array,
): Promise<string> {
  if (!data.length || data.length > LIMITS.fileBytes)
    throw new Error("Choose a nonempty CV file smaller than 5 MiB.");
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "docx") return validateCvText(parseDocx(data));
  if (ext === "txt" || ext === "md") {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(data);
    if (/[\x00-\x08\x0e-\x1f]/.test(text))
      throw new Error("This file does not contain plain text.");
    return validateCvText(text);
  }
  throw new Error(
    ext === "pdf"
      ? "PDF extraction runs on your device. Use the workspace file picker or paste text."
      : "Use PDF, DOCX, TXT, or MD files.",
  );
}
