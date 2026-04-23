import type { ChangeEvent } from "react";
import { DEFAULT_MAX_IMAGE_BYTES, MAX_STORED_DATA_URL_CHARS } from "./constants";
import { readFileAsDataUrl } from "./readFileAsDataUrl";
import { validateLocalImageFile } from "./validateLocalImageFile";

export type PickLocalImageFailureReason =
  | "no_file"
  | "too_large"
  | "bad_type"
  | "empty"
  | "read_failed"
  | "stored_too_large";

export type PickLocalImageAsDataUrlOptions = {
  maxBytes?: number;
};

/**
 * 从 input 的 `change` 事件中读取首个图片文件为 Data URL。
 * 供「本地上传」按钮与业务层复用。
 */
export async function pickLocalImageAsDataUrlFromInputEvent(
  event: ChangeEvent<HTMLInputElement>,
  options?: PickLocalImageAsDataUrlOptions,
): Promise<{ ok: true; dataUrl: string; file: File } | { ok: false; reason: PickLocalImageFailureReason }> {
  const maxBytes = options?.maxBytes ?? DEFAULT_MAX_IMAGE_BYTES;
  const list = event.target.files;
  const file = list?.[0];
  if (!file) return { ok: false, reason: "no_file" };

  const valid = validateLocalImageFile(file, maxBytes);
  if (!valid.ok) {
    if (valid.reason === "too_large") return { ok: false, reason: "too_large" };
    if (valid.reason === "bad_type") return { ok: false, reason: "bad_type" };
    return { ok: false, reason: "empty" };
  }

  try {
    const dataUrl = await readFileAsDataUrl(file);
    if (dataUrl.length > MAX_STORED_DATA_URL_CHARS) {
      return { ok: false, reason: "stored_too_large" };
    }
    return { ok: true, dataUrl, file };
  } catch {
    return { ok: false, reason: "read_failed" };
  }
}
