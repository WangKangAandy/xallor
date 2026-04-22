import { describe, expect, it } from "vitest";
import { createFolderSiteArrangeId, parseFolderSiteArrangeId } from "./arrangeItemIds";

describe("createFolderSiteArrangeId", () => {
  /**
   * 目的：文件夹内站点需要稳定且可逆的组合 id，避免与桌面项 id 冲突。
   */
  it("should_create_encoded_composite_id_when_folder_id_and_site_url_provided", () => {
    const id = createFolderSiteArrangeId("folder-1", "https://example.com/a?b=1#hash");
    expect(id).toBe("folder:folder-1:site:https%3A%2F%2Fexample.com%2Fa%3Fb%3D1%23hash");
  });
});

describe("parseFolderSiteArrangeId", () => {
  /**
   * 目的：命令层删除/移动需要把复合 id 反解为 folderId + siteUrl。
   */
  it("should_parse_folder_and_site_when_composite_id_is_valid", () => {
    const parsed = parseFolderSiteArrangeId("folder:folder-1:site:https%3A%2F%2Fexample.com%2Fpath");
    expect(parsed).toEqual({
      folderId: "folder-1",
      siteUrl: "https://example.com/path",
    });
  });

  /**
   * 目的：异常或非复合 id 输入时应安全返回 null，避免误删桌面项。
   */
  it("should_return_null_when_id_format_is_invalid", () => {
    expect(parseFolderSiteArrangeId("site:abc")).toBeNull();
    expect(parseFolderSiteArrangeId("folder:abc:site:%%%")).toBeNull();
  });
});

