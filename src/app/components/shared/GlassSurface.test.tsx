import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { GlassSurface } from "./GlassSurface";

describe("GlassSurface", () => {
  /**
   * 目的：毛玻璃依赖 `backdrop-blur` 与半透明白底；若类名被误删，浮层会失去统一质感。
   */
  it("should_render_frosted_glass_layer_classes_when_used", () => {
    const html = renderToStaticMarkup(
      <GlassSurface rounded="2xl" className="p-4" data-testid="glass">
        inner
      </GlassSurface>,
    );
    expect(html).toContain("glass-surface-default");
    expect(html).toContain("rounded-2xl");
    expect(html).toContain("inner");
  });

  it("should_apply_panel_variant_class_when_variant_is_panel", () => {
    const html = renderToStaticMarkup(
      <GlassSurface variant="panel" rounded="3xl">
        panel
      </GlassSurface>,
    );
    expect(html).toContain("glass-surface-panel");
    expect(html).toContain("rounded-3xl");
  });

  /**
   * 目的：多桌面指示条等扩展变体必须映射到 theme.css 中的 `.glass-surface-strip`，避免误用 default 导致深色条丢失。
   */
  it("should_apply_strip_variant_class_when_variant_is_strip", () => {
    const html = renderToStaticMarkup(
      <GlassSurface variant="strip" rounded="full">
        dots
      </GlassSurface>,
    );
    expect(html).toContain("glass-surface-strip");
    expect(html).toContain("rounded-full");
  });
});
