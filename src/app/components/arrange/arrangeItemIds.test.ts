import { describe, expect, it } from "vitest";
import { createFolderSiteArrangeId } from "./arrangeItemIds";

describe("createFolderSiteArrangeId", () => {
  /**
   * 目的：文件夹内站点需要稳定且可逆的组合 id，避免与桌面项 id 冲突。
   */
  it("should_create_encoded_composite_id_when_folder_id_and_site_url_provided", () => {
    const id = createFolderSiteArrangeId("folder-1", "https://example.com/a?b=1#hash");
    expect(id).toBe("folder:folder-1:site:https%3A%2F%2Fexample.com%2Fa%3Fb%3D1%23hash");
  });
});

