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

import { loadGridPayload, loadSearchPayload, saveGridPayload, saveSearchPayload } from "./repository";

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
   * 目的：保存搜索配置时，必须附带版本、用户与设备标识等基础元数据。
   */
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

