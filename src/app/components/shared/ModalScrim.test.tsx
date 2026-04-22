import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ModalScrim } from "./ModalScrim";

describe("ModalScrim", () => {
  /**
   * 目的：遮罩使用 L1 `--surface-scrim-bg`，避免业务处硬编码 rgba。
   * 预期：序列化 HTML 含对应 inline style 与可点击的 button。
   */
  it("should_serialize_inline_style_using_surface_scrim_css_variables", () => {
    const html = renderToStaticMarkup(<ModalScrim aria-label="Close backdrop" />);
    expect(html).toContain("var(--surface-scrim-bg)");
    expect(html).toContain("var(--surface-scrim-backdrop-blur");
    expect(html).toContain('aria-label="Close backdrop"');
    expect(html).toContain('type="button"');
  });
});
