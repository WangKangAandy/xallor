import { describe, expect, it, vi, beforeEach } from "vitest";

const { readStorageKeyMock, writeStorageKeyMock, getOrCreateDeviceIdMock } = vi.hoisted(() => ({
  readStorageKeyMock: vi.fn(),
  writeStorageKeyMock: vi.fn(),
  getOrCreateDeviceIdMock: vi.fn(() => "dev-test-1"),
}));

vi.mock("./adapter", () => ({
  readStorageKey: readStorageKeyMock,
  writeStorageKey: writeStorageKeyMock,
  getOrCreateDeviceId: getOrCreateDeviceIdMock,
}));

import {
  loadGridPayload,
  loadMultiPageGridState,
  loadSearchPayload,
  normalizeMultiPageGridPayload,
  saveGridPayload,
  saveMultiPageGridState,
  saveSearchPayload,
} from "./repository";

describe("storage repository", () => {
  beforeEach(() => {
    readStorageKeyMock.mockReset();
    writeStorageKeyMock.mockReset();
  });

  /**
   * 目的：当读取到不支持的 schema 版本时，必须回退到调用方默认值，避免页面因脏数据失效。
   */
  it("should_return_fallback_when_grid_schema_version_is_unsupported", async () => {
    const fallback = { items: [], showLabels: true };
    readStorageKeyMock.mockResolvedValue({
      version: 999,
      payload: { items: [{ id: "x" }], showLabels: false },
    });

    const result = await loadGridPayload(fallback);
    expect(result).toEqual(fallback);
  });

  /**
   * 目的：当已选搜索引擎 ID 不存在于列表中时，自动修正为首个可用引擎。
   */
  it("should_repair_selected_engine_id_when_selected_id_is_missing", async () => {
    const fallback = {
      engines: [{ id: "google", name: "Google", domain: "google.com", searchUrl: "https://google.com?q=" }],
      selectedEngineId: "google",
    };

    readStorageKeyMock.mockResolvedValue({
      version: 1,
      payload: {
        engines: [
          { id: "duck", name: "DuckDuckGo", domain: "duckduckgo.com", searchUrl: "https://duckduckgo.com/?q=" },
        ],
        selectedEngineId: "missing",
      },
    });

    const result = await loadSearchPayload(fallback);
    expect(result.selectedEngineId).toBe("duck");
  });

  /**
   * 目的：保存网格数据时，必须写入 envelope 元数据，保证后续迁移与多端扩展能力。
   */
  it("should_persist_grid_payload_with_envelope_metadata", async () => {
    const payload = { items: [], showLabels: false };
    await saveGridPayload(payload);

    expect(writeStorageKeyMock).toHaveBeenCalledTimes(1);
    const [key, saved] = writeStorageKeyMock.mock.calls[0];
    expect(key).toBe("xallor_grid_v1");
    expect(saved).toMatchObject({
      version: 1,
      userId: "anonymous",
      deviceId: "dev-test-1",
      payload,
    });
    expect(typeof saved.updatedAt).toBe("number");
  });

  /**
   * 目的：旧版多页 JSON 未存 `pageId` 时，加载须补齐 id，避免列表 key 依赖下标。
   */
  it("should_fill_missing_pageIds_when_loading_multipage_payload", () => {
    const raw = {
      pages: [
        { items: [], showLabels: true },
        { items: [], showLabels: true },
      ],
      activePageIndex: 0,
    };
    const out = normalizeMultiPageGridPayload(raw);
    expect(out).not.toBeNull();
    expect(out!.pages[0].pageId.length).toBeGreaterThan(0);
    expect(out!.pages[1].pageId.length).toBeGreaterThan(0);
    expect(out!.pages[0].pageId).not.toBe(out!.pages[1].pageId);
  });

  /**
   * 目的：重复 `pageId` 时须去重，防止后续删/排页时状态错乱。
   */
  it("should_regenerate_duplicate_pageIds_when_normalizing", () => {
    const raw = {
      pages: [
        { items: [], showLabels: true, pageId: "dup" },
        { items: [], showLabels: true, pageId: "dup" },
      ],
      activePageIndex: 0,
    };
    const out = normalizeMultiPageGridPayload(raw);
    expect(out!.pages[0].pageId).toBe("dup");
    expect(out!.pages[1].pageId).not.toBe("dup");
  });

  /**
   * 目的：无多页键时，应把 legacy 单页 `xallor_grid_v1` 迁成 MultiPageGridState，避免老用户丢桌面。
   */
  it("should_wrap_legacy_grid_payload_as_first_page_when_multipage_key_missing", async () => {
    const fallback = {
      pages: [
        {
          items: [
            {
              id: "fallback",
              type: "site" as const,
              shape: { cols: 1, rows: 1 },
              site: { name: "x", domain: "x.com", url: "https://x.com" },
            },
          ],
          showLabels: true,
          pageId: "fallback-page",
        },
      ],
      activePageIndex: 0,
    };
    readStorageKeyMock.mockImplementation(async (key: string) => {
      if (key === "xallor_multipage_grid_v1") return null;
      if (key === "xallor_grid_v1") {
        return { version: 1, payload: { items: [], showLabels: false } };
      }
      return null;
    });

    const result = await loadMultiPageGridState(fallback);
    expect(result.pages[0].items).toEqual([]);
    expect(result.pages[0].showLabels).toBe(false);
    expect(typeof result.pages[0].pageId).toBe("string");
    expect(result.activePageIndex).toBe(0);
  });

  /**
   * 目的：多页状态必须写入独立存储键，与 legacy 单页键分离。
   */
  it("should_persist_multipage_state_under_multipage_key", async () => {
    const state = {
      pages: [
        { items: [], showLabels: true, pageId: "p1" },
        { items: [], showLabels: true, pageId: "p2" },
      ],
      activePageIndex: 1,
    };
    await saveMultiPageGridState(state);

    expect(writeStorageKeyMock).toHaveBeenCalled();
    const call = writeStorageKeyMock.mock.calls.find((c) => c[0] === "xallor_multipage_grid_v1");
    expect(call).toBeDefined();
    expect(call![1]).toMatchObject({ version: 1, payload: state });
  });

  it("should_persist_search_payload_with_envelope_metadata", async () => {
    const payload = {
      engines: [{ id: "g", name: "Google", domain: "google.com", searchUrl: "https://google.com?q=" }],
      selectedEngineId: "g",
    };

    await saveSearchPayload(payload);

    const [key, saved] = writeStorageKeyMock.mock.calls[0];
    expect(key).toBe("xallor_search_v1");
    expect(saved).toMatchObject({
      version: 1,
      userId: "anonymous",
      deviceId: "dev-test-1",
      payload,
    });
  });
});

