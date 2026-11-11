import { requireRole } from "@/lib/api/auth-guard";
import { jsonError, jsonOk } from "@/lib/api/response";
import { uploadImageBuffer } from "@/lib/cloudinary/upload";

export async function POST(request: Request) {
  const { response } = await requireRole(["admin"]);
  if (response) return response;
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonError("VALIDATION", "File required", 400);
  }
  const file = form.get("file");
  if (!file || !(file instanceof File)) {
    return jsonError("VALIDATION", "File required", 400);
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  try {
    const result = await uploadImageBuffer(buffer, file.type);
    return jsonOk(result);
  } catch (e) {
    return jsonError("UPLOAD_FAILED", (e as Error).message, 400);
  }
}
