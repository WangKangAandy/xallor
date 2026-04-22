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

import { MAX_DESKTOP_PAGES } from "./multiPageLimits";
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
    expect(result.pages[0].widgetLayout).toBeDefined();
    expect(result.pages[0].widgetLayout!.widgets).toEqual([]);
    expect(result.activePageIndex).toBe(0);
  });

  /**
   * 目的：存储页数超过上限时加载须裁到前 N 页，与运行时「最多 N 页」一致。
   */
  it("should_clamp_stored_pages_to_max_when_loading", async () => {
    const sevenPages = Array.from({ length: 7 }, (_, i) => ({
      items: [],
      showLabels: true,
      pageId: `id-${i}`,
    }));
    readStorageKeyMock.mockImplementation(async (key: string) => {
      if (key === "xallor_multipage_grid_v1") {
        return { version: 1, payload: { pages: sevenPages, activePageIndex: 6 } };
      }
      return null;
    });
    const fallback = {
      pages: [{ items: [], showLabels: true, pageId: "fb" }],
      activePageIndex: 0,
    };
    const result = await loadMultiPageGridState(fallback);
    expect(result.pages.length).toBe(MAX_DESKTOP_PAGES);
    expect(result.activePageIndex).toBe(5);
    expect(result.pages.every((p) => p.widgetLayout !== undefined)).toBe(true);
  });

  /**
   * 目的：当存量多页数据缺少 `widgetLayout` 时，读取应按 items 自动补齐并持久化一致语义。
   */
  it("should_fill_widget_layout_from_items_when_layout_missing_in_multipage_payload", async () => {
    readStorageKeyMock.mockImplementation(async (key: string) => {
      if (key === "xallor_multipage_grid_v1") {
        return {
          version: 1,
          payload: {
            pages: [
              {
                items: [
                  {
                    id: "s-1",
                    type: "site" as const,
                    shape: { cols: 1, rows: 1 },
                    site: { name: "GitHub", domain: "github.com", url: "https://github.com" },
                  },
                ],
                showLabels: true,
                pageId: "p-1",
              },
            ],
            activePageIndex: 0,
          },
        };
      }
      return null;
    });
    const fallback = { pages: [{ items: [], showLabels: true, pageId: "fb" }], activePageIndex: 0 };
    const result = await loadMultiPageGridState(fallback);
    expect(result.pages[0].widgetLayout).toBeDefined();
    expect(result.pages[0].widgetLayout!.widgets).toEqual(["s-1"]);
    expect(result.pages[0].widgetLayout!.layout[0].id).toBe("s-1");
  });

  /**
   * 目的：布局策略开关需可持久化；关闭自动补位后，读取结果应保留 false。
   */
  it("should_preserve_widget_layout_auto_compact_switch_when_loading", async () => {
    readStorageKeyMock.mockImplementation(async (key: string) => {
      if (key === "xallor_multipage_grid_v1") {
        return {
          version: 1,
          payload: {
            pages: [
              {
                items: [],
                showLabels: true,
                pageId: "p-1",
                widgetLayout: {
                  widgets: [],
                  layout: [],
                  autoCompactEnabled: false,
                },
              },
            ],
            activePageIndex: 0,
          },
        };
      }
      return null;
    });
    const fallback = { pages: [{ items: [], showLabels: true, pageId: "fb" }], activePageIndex: 0 };
    const result = await loadMultiPageGridState(fallback);
    expect(result.pages[0].widgetLayout?.autoCompactEnabled).toBe(false);
    expect(result.pages[0].widgetLayout?.compactionStrategy).toBe("no-compact");
  });

  /**
   * 目的：冲突策略应能被读取并标准化，避免旧数据缺省导致运行时策略不确定。
   */
  it("should_preserve_widget_layout_conflict_strategy_when_loading", async () => {
    readStorageKeyMock.mockImplementation(async (key: string) => {
      if (key === "xallor_multipage_grid_v1") {
        return {
          version: 1,
          payload: {
            pages: [
              {
                items: [],
                showLabels: true,
                pageId: "p-1",
                widgetLayout: {
                  widgets: [],
                  layout: [],
                  conflictStrategy: "swap",
                },
              },
            ],
            activePageIndex: 0,
          },
        };
      }
      return null;
    });
    const fallback = { pages: [{ items: [], showLabels: true, pageId: "fb" }], activePageIndex: 0 };
    const result = await loadMultiPageGridState(fallback);
    expect(result.pages[0].widgetLayout?.conflictStrategy).toBe("swap");
  });

  /**
   * 目的：保存前裁掉超出上限的尾页，避免持久化与 reducer 不一致。
   */
  it("should_clamp_pages_before_save", async () => {
    const sevenPages = Array.from({ length: 7 }, (_, i) => ({
      items: [],
      showLabels: true,
      pageId: `id-${i}`,
    }));
    await saveMultiPageGridState({ pages: sevenPages, activePageIndex: 6 });
    const call = writeStorageKeyMock.mock.calls.find((c) => c[0] === "xallor_multipage_grid_v1");
    expect(call).toBeDefined();
    expect(call![1].payload.pages.length).toBe(MAX_DESKTOP_PAGES);
    expect(call![1].payload.activePageIndex).toBe(5);
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

  /**
   * 目的：模拟 RGL 拖拽后布局写回并刷新页面，需保证 widgetLayout 坐标可完整持久化并按原值加载。
   */
  it("should_restore_widget_layout_positions_after_save_and_reload", async () => {
    const state = {
      pages: [
        {
          items: [
            {
              id: "s1",
              type: "site" as const,
              shape: { cols: 1, rows: 1 },
              site: { name: "Site1", domain: "s1.com", url: "https://s1.com" },
            },
          ],
          showLabels: true,
          pageId: "p1",
          widgetLayout: {
            widgets: ["s1"],
            layout: [{ id: "s1", x: 3, y: 2, w: 1, h: 1, mode: "floating" as const, resizable: false }],
            compactionStrategy: "compact" as const,
            conflictStrategy: "eject" as const,
          },
        },
      ],
      activePageIndex: 0,
    };

    await saveMultiPageGridState(state);
    const savedEnvelope = writeStorageKeyMock.mock.calls.find((c) => c[0] === "xallor_multipage_grid_v1")?.[1];
    expect(savedEnvelope).toBeDefined();

    readStorageKeyMock.mockImplementation(async (key: string) => {
      if (key === "xallor_multipage_grid_v1") {
        return savedEnvelope;
      }
      return null;
    });

    const fallback = { pages: [{ items: [], showLabels: true, pageId: "fb" }], activePageIndex: 0 };
    const loaded = await loadMultiPageGridState(fallback);
    expect(loaded.pages[0].widgetLayout?.layout[0]).toMatchObject({ id: "s1", x: 3, y: 2, w: 1, h: 1 });
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

