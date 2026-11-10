import { getCurrentUser } from "@/lib/auth";
import { LIMITS } from "@/lib/contracts";
import { parseCvFileBuffer } from "@/lib/parsers/cv-parser";
import { apiError, json, checkOrigin, rateLimit, HttpError } from "@/lib/http";
export async function POST(req: Request) {
  try {
    checkOrigin(req);
    const user = await getCurrentUser();
    if (!user) throw new HttpError(401, "Please sign in.");
    await rateLimit(req, "parse", 20, 10 * 60000, user.id);
    const limit = LIMITS.selectionBytes + 128 * 1024;
    if (Number(req.headers.get("content-length")) > limit)
      throw new HttpError(413, "Keep each selection below 20 MiB.");
    const reader = req.body?.getReader();
    if (!reader) throw new HttpError(400, "Choose CV files to read.");
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > limit) {
        await reader.cancel();
        throw new HttpError(413, "Keep each selection below 20 MiB.");
      }
      chunks.push(value);
    }
    const form = await new Response(Buffer.concat(chunks), {
      headers: { "Content-Type": req.headers.get("content-type") || "" },
    }).formData();
    const files = form.getAll("files");
    if (
      !files.length ||
      files.length > LIMITS.files ||
      files.some((f) => !(f instanceof File))
    )
      throw new HttpError(400, "Choose between 1 and 20 files.");
    const cvs = [];
    const failures = [];
    for (const entry of files) {
      const file = entry as File;
      try {
        cvs.push({
          fileName: file.name,
          rawText: await parseCvFileBuffer(
            file.name,
            new Uint8Array(await file.arrayBuffer()),
          ),
        });
      } catch (error) {
        failures.push({
          fileName: file.name,
          error:
            error instanceof Error
              ? error.message
              : "This file could not be read.",
        });
      }
    }
    return json({ cvs, failures });
  } catch (error) {
    return apiError(error);
  }
}
