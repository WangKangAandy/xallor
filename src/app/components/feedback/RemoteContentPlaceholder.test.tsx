import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { RemoteContentPlaceholder } from "./RemoteContentPlaceholder";

/**
 * 目的：异步占位在 loading / error / ready 三态下结构稳定，供未来 API 接入复用（不依赖 @testing-library）。
 */
describe("RemoteContentPlaceholder", () => {
  it("should_render_loading_shell_when_phase_is_loading", () => {
    const html = renderToStaticMarkup(<RemoteContentPlaceholder phase="loading" loadingLabel="请稍候…" />);
    expect(html).toContain("请稍候…");
    expect(html).toContain('role="status"');
  });

  it("should_render_error_shell_with_retry_when_phase_is_error", () => {
    const html = renderToStaticMarkup(
      <RemoteContentPlaceholder phase="error" errorTitle="出错了" errorHint="网络异常" onRetry={() => {}} />,
    );
    expect(html).toContain("出错了");
    expect(html).toContain("网络异常");
    expect(html).toContain("重试");
    expect(html).toContain('role="alert"');
  });

  it("should_render_children_when_phase_is_ready", () => {
    const html = renderToStaticMarkup(
      <RemoteContentPlaceholder phase="ready">
        <span>inner</span>
      </RemoteContentPlaceholder>,
    );
    expect(html).toContain("inner");
  });
});
