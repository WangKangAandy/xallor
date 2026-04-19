# 默认搜索引擎设置实现计划（轻量版）

本文档记录「设置 → 通用 → 默认搜索引擎」的落地方案。目标是把搜索引擎选择从 `SearchBar` 组件内状态升级为**全局单一数据源**，同时避免过早平台化设计。

---

## 1. 目标与边界

### 目标

- 在设置的**通用**中新增「默认搜索引擎」项。
- 默认值（首次无存储）为**百度**。
- 点击该项弹出小框（popover/listbox）选择默认引擎。
- `SearchBar` 与设置共享同一状态源，设置修改后即时生效并持久化。

### 非目标（本期不做）

- 不做“搜索引擎插件系统 / marketplace”。
- 不做云同步。
- 不新增复杂状态管理框架（仅沿用现有 `UiPreferencesProvider`）。
- 不引入多版本迁移系统（保留基础 sanitize 即可）。
- 不在本期处理“用户自定义引擎管理”迁移（现有入口可暂保留，但不作为本方案数据模型前提）。

---

## 2. 当前现状与问题

| 点 | 现状 | 问题 |
|----|------|------|
| 搜索引擎状态 | `SearchBar` 内 `useState(engines)` + `useState(selected)` | 设置无法作为同源入口，易出现双源漂移 |
| 持久化 | `loadSearchPayload/saveSearchPayload` 已存在 | 数据在 `SearchBar` 内闭环，其他 UI 不可直接消费 |
| 默认值 | 回退到 `DEFAULT_ENGINES[0]` | 需求改为默认百度，需明确首次默认与历史兼容 |

核心问题：**状态源在组件内，无法支撑“设置页统一配置”**。

---

## 3. 设计原则（本期钉死）

1. **单一数据源**：默认引擎由全局偏好层持有，组件只消费。
2. **轻量模型**：只保留满足当前需求的数据结构，不提前抽象领域框架。
3. **即时持久化**：该偏好变更频率低，直接写存储，不做防抖。
4. **初始化修复一次**：读取时做 sanitize；运行期不做复杂 validator 管道。

---

## 4. 数据模型（再压缩版）

```ts
type SearchEngine = {
  id: string;
  name: string;
  searchUrl: string;
};

type SearchPreference = {
  selectedId: string;
};
```

说明：
- `SearchEngine[]` 视为**静态配置**（`DEFAULT_ENGINES` 常量），不进入 preference 存储。
- `SearchPreference` 只保存**用户偏好**：`selectedId`。
- 这样可避免 `engines` 被 storage 污染，也避免“静态配置生命周期”与“用户偏好生命周期”混杂。

---

## 5. 存储与回退策略

### 5.1 默认规则

- 统一极简规则（读取时一次性 sanitize）：

```ts
selectedId = engines.some((e) => e.id === stored) ? stored : "baidu";
```

- 无存储或非法值均回到 `baidu`。
- 已有合法历史保持原值，不覆盖用户选择。

### 5.2 API（建议）

- `getSearchPreference(): SearchPreference`
- `setSearchPreference(next: SearchPreference): void`（仅写 `selectedId`）
- `resolveSearchEngineId(storedId: string | null | undefined, engines: SearchEngine[]): string`

> 本期不引入版本化迁移；只做“读取时 sanitize”。
> fallback 规则只在 `resolveSearchEngineId` 一处定义，Provider / storage / UI 不得重复实现。

---

## 6. Provider 落地（方案二核心）

在 `UiPreferencesProvider` 中新增搜索偏好子域：

- `selectedSearchEngineId`
- `setSearchEngine(id: string)`

约束：
- Provider **不管理 `engines` 列表**（引擎列表来自静态常量文件，如 `src/app/constants/searchEngines.ts`）。
- `SearchBar` 不再持有 `selected` 真源状态。
- 设置页不再自行维护“默认引擎”局部状态。
- 两端都从 `useUiPreferences()` 读取并更新。

> 本期不暴露 `addSearchEngine` 等可扩展 API；避免提前平台化。

---

## 7. UI 变更

### 7.1 设置页（通用）

- 新增一行：`默认搜索引擎`
- 右侧展示当前值（例如：`百度`）
- 点击弹出小框列出可选引擎（来自静态 `DEFAULT_ENGINES`）
- 选中后关闭小框并更新 `selectedId`

### 7.2 SearchBar

- 通过 `searchEngineRegistry` 读取引擎信息（`getAllSearchEngines` / `getSearchEngineById`），不直接依赖裸数组常量。
- `selectedEngine` 通过 `selectedSearchEngineId` + registry 派生
- 执行搜索逻辑不变（仍按 `searchUrl` 拼接）

---

## 8. 交互与层级注意事项

- 设置页内小框应遵守现有模态层级契约，避免穿透/误关设置。
- 点击小框外关闭小框；点击设置外关闭设置（两者行为不冲突）。
- 保持键盘可达性（Esc 关闭小框可作为加分项）。

---

## 9. 测试计划（必须）

### 单元 / 偏好层

- 无存储时默认百度。
- `selectedId` 非法时修复回退逻辑正确。
- 设置 `selectedId` 后写入存储成功。

### 组件 / 集成

- 设置页选择默认引擎后，`SearchBar` 立即显示对应引擎。
- 刷新后仍保持用户选择。
- 点击小框外只关闭小框，不误关设置（或按产品定义断言）。
- 点击设置外仍可关闭设置（防回归）。

---

## 10. 分阶段实施顺序

1. 新增轻量 search preference 读取/写入与 sanitize。
2. 抽出静态引擎常量（`constants/searchEngines.ts`）。
3. 扩展 `UiPreferencesProvider` 暴露 `selectedSearchEngineId + setSelectedSearchEngineId`。
4. 改造 `SearchBar` 消费全局状态（不再把 `engines` 当偏好存储）。
5. 在设置通用页新增“默认搜索引擎”选择 UI。
6. 补单测/集成测试并跑通 `typecheck` + `vitest`。

---

## 11. 风险与缓解

| 风险 | 缓解 |
|------|------|
| SearchBar 与设置出现双源状态 | 先完成 Provider 接入，再改 UI；中途不保留双写逻辑 |
| 存储兼容导致选中丢失 | 读取时统一 sanitize，并补非法值测试 |
| 模态层级回归（点击外部关闭） | 补对应回归测试，锁住行为 |

---

## 12. 一句话决策

> 保留“单一数据源 + Provider 聚合 + 默认回退链”，去掉“过度抽象与可扩展 API 预埋”，先把默认搜索引擎配置做稳做通。

