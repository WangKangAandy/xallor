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
    expect(html).toContain("backdrop-blur-xl");
    expect(html).toContain("bg-white/");
    expect(html).toContain("rounded-2xl");
    expect(html).toContain("inner");
  });
});
