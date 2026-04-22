import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { SegmentedControl } from "./SegmentedControl";

describe("SegmentedControl", () => {
  /**
   * 目的：与设置里布局/语言切换共用同一套轨道样式；若轨道类名被删，两处会同时失真。
   */
  it("should_render_track_and_active_segment_classes_when_first_option_selected", () => {
    const html = renderToStaticMarkup(
      <SegmentedControl
        value="a"
        onChange={() => {}}
        options={[
          { value: "a", label: "A" },
          { value: "b", label: "B" },
        ]}
        ariaLabel="pick"
      />,
    );
    expect(html).toContain("bg-slate-100/80");
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain("bg-white");
    expect(html).toContain("shadow-sm");
  });

  it("should_pass_testid_to_segment_buttons_when_provided", () => {
    const html = renderToStaticMarkup(
      <SegmentedControl
        value="x"
        onChange={() => {}}
        options={[{ value: "x", label: "X", testId: "seg-x" }]}
        ariaLabel="t"
      />,
    );
    expect(html).toContain('data-testid="seg-x"');
  });
});
