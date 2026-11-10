import { inflateSync } from "fflate";
const MAX_XML = 2 * 1024 * 1024;
const decoder = new TextDecoder("utf-8", { fatal: true });
function xmlText(xml: string) {
  if (/<!DOCTYPE|<!ENTITY/i.test(xml))
    throw new Error("This DOCX contains unsupported XML declarations.");
  return xml
    .replace(/<\/w:p\s*>/g, "\n")
    .replace(/<w:(?:tab|br)[^>]*\/>/g, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/&#(x[0-9a-f]+|\d+);/gi, (_, entity: string) => {
      const code =
        entity[0].toLowerCase() === "x"
          ? parseInt(entity.slice(1), 16)
          : Number(entity);
      return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : "";
    })
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .trim();
}
export function parseDocx(data: Uint8Array): string {
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  let end = -1;
  for (let i = data.length - 22; i >= Math.max(0, data.length - 65557); i--)
    if (view.getUint32(i, true) === 0x06054b50) {
      end = i;
      break;
    }
  if (end < 0) throw new Error("This DOCX is not a readable ZIP document.");
  const entries = view.getUint16(end + 10, true);
  let pos = view.getUint32(end + 16, true);
  if (entries > 1000)
    throw new Error("This DOCX has too many archive entries.");
  for (let n = 0; n < entries; n++) {
    if (pos + 46 > data.length || view.getUint32(pos, true) !== 0x02014b50)
      throw new Error("This DOCX archive is corrupt.");
    const flags = view.getUint16(pos + 8, true),
      method = view.getUint16(pos + 10, true);
    const compressed = view.getUint32(pos + 20, true),
      size = view.getUint32(pos + 24, true);
    const nameLen = view.getUint16(pos + 28, true),
      extra = view.getUint16(pos + 30, true),
      comment = view.getUint16(pos + 32, true);
    const name = decoder.decode(data.subarray(pos + 46, pos + 46 + nameLen));
    if (name === "word/document.xml") {
      if (flags & 1)
        throw new Error(
          "Password-protected DOCX files are not supported. Paste the CV text instead.",
        );
      if (size > MAX_XML || ![0, 8].includes(method))
        throw new Error("This DOCX is too complex to extract safely.");
      const local = view.getUint32(pos + 42, true);
      if (
        local + 30 > data.length ||
        view.getUint32(local, true) !== 0x04034b50
      )
        throw new Error("This DOCX archive is corrupt.");
      const start =
        local +
        30 +
        view.getUint16(local + 26, true) +
        view.getUint16(local + 28, true);
      if (start + compressed > data.length)
        throw new Error("This DOCX archive is incomplete.");
      const payload = data.subarray(start, start + compressed);
      const xml =
        method === 8
          ? inflateSync(payload, { out: new Uint8Array(size) })
          : payload;
      if (xml.byteLength !== size)
        throw new Error("This DOCX has inconsistent archive sizes.");
      return xmlText(decoder.decode(xml));
    }
    pos += 46 + nameLen + extra + comment;
  }
  throw new Error("No document text was found in this DOCX.");
}
