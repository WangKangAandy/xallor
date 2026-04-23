/**
 * @vitest-environment jsdom
 */
import { act } from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { createRoot } from "react-dom/client";
import { AppI18nProvider } from "../../i18n/AppI18n";
import { ZH_CN } from "../../i18n/messages";
import * as PickModule from "../../localUpload/pickLocalImageAsDataUrl";
import { AddIconPreviewPanel } from "./AddIconPreviewPanel";

vi.mock("../../localUpload/pickLocalImageAsDataUrl", () => ({
  pickLocalImageAsDataUrlFromInputEvent: vi.fn(),
}));

const githubSite = {
  kind: "site" as const,
  id: "cat-site-github",
  name: "GitHub",
  domain: "github.com",
  url: "https://github.com",
};

describe("AddIconPreviewPanel", () => {
  beforeEach(() => {
    vi.mocked(PickModule.pickLocalImageAsDataUrlFromInputEvent).mockReset();
  });

  /**
   * 目的：自定义图标入口收敛为「+」槽直传文件，避免额外 Upload/Clear 行干扰版式。
   * 前置：选中内置站点，侧栏为中文。
   * 预期：存在带「上传本地图标」标签的槽位；页面不再出现「清除自定义图标」文案。
   */
  it("should_show_plus_upload_slot_and_hide_clear_custom_icon_copy", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(
        <AppI18nProvider>
          <AddIconPreviewPanel
            selected={githubSite}
            contextSiteId={null}
            onClose={() => {}}
            showCloseButton={false}
            onAdd={() => {}}
          />
        </AppI18nProvider>,
      );
    });

    expect(container.querySelector(`button[aria-label="${ZH_CN["addIcon.uploadCustomIcon"]}"]`)).toBeTruthy();
    expect(container.textContent).not.toContain("清除自定义图标");

    act(() => {
      root.unmount();
    });
    document.body.removeChild(container);
  });

  /**
   * 目的：从「+」槽选图成功后应切到自定义变体并带上 Data URL，便于用户直接点「添加」落盘。
   * 前置：mock 图片解析为固定 data URL。
   * 预期：预览区出现对应 img；点击添加后 onAdd 收到 iconVariant 3 与 customIconDataUrl。
   */
  it("should_set_custom_variant_and_include_data_url_in_payload_when_file_picked_then_add", async () => {
    const dataUrl = "data:image/png;base64,QQ==";
    vi.mocked(PickModule.pickLocalImageAsDataUrlFromInputEvent).mockResolvedValue({
      ok: true,
      dataUrl,
      file: new File([], "icon.png", { type: "image/png" }),
    });

    const onAdd = vi.fn();
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(
        <AppI18nProvider>
          <AddIconPreviewPanel
            selected={githubSite}
            contextSiteId={null}
            onClose={() => {}}
            showCloseButton={false}
            onAdd={onAdd}
          />
        </AppI18nProvider>,
      );
    });

    const input = container.querySelector<HTMLInputElement>('input[type="file"]');
    expect(input).toBeTruthy();

    await act(async () => {
      input!.dispatchEvent(new Event("change", { bubbles: true }));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(container.querySelector(`img[src="${dataUrl}"]`)).toBeTruthy();

    const addLabel = ZH_CN["addIcon.add"];
    const addBtn = [...container.querySelectorAll("button")].find((b) => b.textContent?.trim() === addLabel);
    expect(addBtn).toBeTruthy();

    act(() => {
      addBtn!.click();
    });

    expect(onAdd).toHaveBeenCalledTimes(1);
    const payload = onAdd.mock.calls[0][0];
    expect(payload?.kind).toBe("site");
    if (payload?.kind === "site") {
      expect(payload.site.iconVariant).toBe(3);
      expect(payload.site.customIconDataUrl).toBe(dataUrl);
    }

    act(() => {
      root.unmount();
    });
    document.body.removeChild(container);
  });
});
