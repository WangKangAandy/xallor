const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"]);

export type ValidateLocalImageFileFailureReason = "empty" | "too_large" | "bad_type";

export type ValidateLocalImageFileResult =
  | { ok: true }
  | { ok: false; reason: ValidateLocalImageFileFailureReason };

/** 校验用户选取的本地图片文件体积与 MIME（类型为空时放行，由解码阶段兜底）。 */
export function validateLocalImageFile(file: File, maxBytes: number): ValidateLocalImageFileResult {
  if (!file.size) return { ok: false, reason: "empty" };
  if (file.size > maxBytes) return { ok: false, reason: "too_large" };
  const mime = file.type.trim().toLowerCase();
  if (!mime) return { ok: true };
  const base = mime.split(";")[0]?.trim() ?? "";
  if (!ALLOWED_TYPES.has(base)) return { ok: false, reason: "bad_type" };
  return { ok: true };
}
