import { zipSync, strToU8 } from "fflate";
function makePdf(objects) {
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (let i = 0; i < objects.length; i++) {
    offsets.push(Buffer.byteLength(pdf));
    pdf += i + 1 + " 0 obj\n" + objects[i] + "\nendobj\n";
  }
  const xref = Buffer.byteLength(pdf);
  pdf +=
    "xref\n0 " +
    (objects.length + 1) +
    "\n0000000000 65535 f \n" +
    offsets
      .slice(1)
      .map((n) => String(n).padStart(10, "0") + " 00000 n \n")
      .join("") +
    "trailer\n<< /Size " +
    (objects.length + 1) +
    " /Root 1 0 R >>\nstartxref\n" +
    xref +
    "\n%%EOF\n";
  return Buffer.from(pdf);
}
export function pdfFixture(
  text = "Candidate Example has production TypeScript and Python experience.",
) {
  const content = text
    ? "BT /F1 12 Tf 50 740 Td (" + text.replace(/[\\()]/g, "\\$&") + ") Tj ET"
    : "q 200 0 0 200 50 500 cm /Im1 Do Q";
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> " +
      (!text ? "/XObject << /Im1 6 0 R >>" : "") +
      " >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Length " +
      Buffer.byteLength(content) +
      " >>\nstream\n" +
      content +
      "\nendstream",
  ];
  if (!text)
    objects.push(
      "<< /Type /XObject /Subtype /Image /Width 1 /Height 1 /ColorSpace /DeviceGray /BitsPerComponent 8 /Length 1 >>\nstream\n\x7f\nendstream",
    );
  return makePdf(objects);
}
export function multiPagePdfFixture(count = 31) {
  const font = count + 3,
    content = count + 4;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [" +
      Array.from({ length: count }, (_, i) => i + 3 + " 0 R").join(" ") +
      "] /Count " +
      count +
      " >>",
  ];
  for (let i = 0; i < count; i++)
    objects.push(
      "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 " +
        font +
        " 0 R >> >> /Contents " +
        content +
        " 0 R >>",
    );
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  const text =
    "BT /F1 12 Tf 50 740 Td (Candidate professional experience with TypeScript and Python.) Tj ET";
  objects.push(
    "<< /Length " +
      Buffer.byteLength(text) +
      " >>\nstream\n" +
      text +
      "\nendstream",
  );
  return makePdf(objects);
}
export function docxFixture() {
  return Buffer.from(
    zipSync({
      "[Content_Types].xml": strToU8(
        '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',
      ),
      "_rels/.rels": strToU8(
        '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
      ),
      "word/document.xml": strToU8(
        '<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>தமிழ் Candidate</w:t></w:r></w:p><w:p><w:r><w:t>Built production TypeScript and Python applications for seven years.</w:t></w:r></w:p></w:body></w:document>',
      ),
    }),
  );
}
