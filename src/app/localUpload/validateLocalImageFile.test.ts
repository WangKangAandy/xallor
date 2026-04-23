/**
 * @vitest-environment node
 */
import { describe, expect, it } from "vitest";
import { validateLocalImageFile } from "./validateLocalImageFile";

describe("validateLocalImageFile", () => {
  /**
   * 目的：防止超大文件进入 FileReader / localStorage。
   * 预期：超过 maxBytes 时返回 too_large。
   */
  it("should_reject_when_file_exceeds_max_bytes", () => {
    const file = new File([new Uint8Array(60)], "x.png", { type: "image/png" });
    expect(validateLocalImageFile(file, 50)).toEqual({ ok: false, reason: "too_large" });
  });

  /**
   * 目的：拒绝明显非图片 MIME，避免误读恶意类型。
   * 预期：application/octet-stream 等非 image/* 返回 bad_type。
   */
  it("should_reject_non_image_mime_when_declared", () => {
    const file = new File([new Uint8Array(4)], "x.bin", { type: "application/octet-stream" });
    expect(validateLocalImageFile(file, 1024)).toEqual({ ok: false, reason: "bad_type" });
  });

  /**
   * 目的：部分环境未填充 file.type，交由后续解码兜底。
   * 预期：类型为空且体积合法时放行。
   */
  it("should_allow_empty_mime_when_size_ok", () => {
    const file = new File([new Uint8Array(8)], "photo", { type: "" });
    expect(validateLocalImageFile(file, 1024)).toEqual({ ok: true });
  });
});
