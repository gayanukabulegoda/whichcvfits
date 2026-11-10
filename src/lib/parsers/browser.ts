import { LIMITS } from "../contracts";
import { parseCvFileBuffer, validateCvText } from "./cv-parser";
export interface ParsedDocument {
  rawText: string;
  fingerprint: string;
}
export async function parseBrowserFile(file: File): Promise<ParsedDocument> {
  if (!file.size || file.size > LIMITS.fileBytes)
    throw new Error("Choose a nonempty file no larger than 5 MiB.");
  if (!/\.(pdf|docx|txt|md)$/i.test(file.name))
    throw new Error("Use PDF, DOCX, TXT, or MD files.");
  const data = new Uint8Array(await file.arrayBuffer());
  const fingerprint = Array.from(
    new Uint8Array(await crypto.subtle.digest("SHA-256", data)),
  )
    .map((v) => v.toString(16).padStart(2, "0"))
    .join("");
  if (!/\.pdf$/i.test(file.name))
    return { fingerprint, rawText: await parseCvFileBuffer(file.name, data) };
  if (new TextDecoder().decode(data.subarray(0, 5)) !== "%PDF-")
    throw new Error("This file is not a valid PDF.");
  // Keep PDF.js as a native browser module. Webpack's development/HMR wrapper
  // can break its module initialization even when the production bundle works.
  const moduleUrl = new URL("/workers/pdf.min.mjs", window.location.origin)
    .href;
  const pdfjs: typeof import("pdfjs-dist") = await import(
    /* webpackIgnore: true */ moduleUrl
  );
  pdfjs.GlobalWorkerOptions.workerSrc = "/workers/pdf.worker.min.mjs";
  const task = pdfjs.getDocument({
    data,
    isEvalSupported: false,
    disableFontFace: true,
    useSystemFonts: false,
    stopAtErrors: true,
    maxImageSize: 16777216,
  });
  const timeout = setTimeout(() => {
    void task.destroy();
  }, 30000);
  try {
    const pdf = await task.promise;
    if (pdf.numPages > LIMITS.pages)
      throw new Error(
        "This PDF exceeds 30 pages. Upload a shorter CV or paste its relevant text.",
      );
    const pages: string[] = [];
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();
      const text = content.items
        .map((item) =>
          "str" in item ? item.str + (item.hasEOL ? "\n" : " ") : "",
        )
        .join("")
        .trim();
      if (text.length < 5)
        throw new Error(
          "Page " +
            pageNum +
            " has no readable text. This may be a scan; paste the complete CV text instead.",
        );
      pages.push(text);
      if (pages.join("\n\n").length > LIMITS.cvChars)
        throw new Error(
          "This CV exceeds 50,000 characters. Paste a shorter version instead.",
        );
      page.cleanup();
    }
    return { fingerprint, rawText: validateCvText(pages.join("\n\n")) };
  } catch (error) {
    if (error instanceof Error && /password/i.test(error.name + error.message))
      throw new Error(
        "This PDF is password-protected. Unlock it first or paste the text.",
      );
    throw error instanceof Error
      ? error
      : new Error("This PDF could not be read. Paste the CV text instead.");
  } finally {
    clearTimeout(timeout);
    await task.destroy();
  }
}
