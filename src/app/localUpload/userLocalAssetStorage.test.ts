/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it } from "vitest";
import { loadStoredDataUrl, persistDataUrl } from "./userLocalAssetStorage";

describe("userLocalAssetStorage", () => {
  afterEach(() => {
    localStorage.clear();
  });

  /**
   * 目的：持久化壁纸/头像 Data URL 后应能原样读出。
   * 预期：写入合法 data:image PNG 再 load 得到同一字符串。
   */
  it("should_round_trip_small_png_data_url", () => {
    const key = "test-avatar";
    const dataUrl = "data:image/png;base64,iVBORw0KGgo=";
    persistDataUrl(key, dataUrl);
    expect(loadStoredDataUrl(key)).toBe(dataUrl);
  });

  /**
   * 目的：防止非图片字符串污染存储键。
   * 预期：非 data:image/ 前缀时 persist 不写库，读取为空。
   */
  it("should_not_store_non_image_data_url", () => {
    const key = "test-bad";
    persistDataUrl(key, "data:text/plain;base64,abcd");
    expect(loadStoredDataUrl(key)).toBeNull();
  });
});
