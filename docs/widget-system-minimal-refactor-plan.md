# Widget 系统最小重构计划（先不强切 RGL）

## 0) 背景与目标

当前项目已具备以下基础：

- 网格交互：`DesktopGrid` + `useGridDnD`
- 视觉表面：`GridDesktopCardSurface`（`gridTile` / `gridPanel`）
- 标题复用：`GridItemLabel`
- 持久化：多桌面页状态已接入

当前瓶颈是：新增一个“天气类组件”仍需改动多处逻辑，缺少统一的组件注册与布局语义层。

本计划目标：

1. 不立即替换现有交互引擎（暂不强切 `react-grid-layout`）
2. 先补齐 Widget 可扩展骨架：`WidgetRegistry + layout schema`
3. 让新增组件从“改分支”变成“注册配置”
4. 为后续 RGL 迁移保留兼容路径

---

## 1) 设计原则

- **渐进迁移**：优先保留现有可用交互，不做大爆炸重写
- **注册优先**：新增 widget 通过注册表声明，不在多处 `if/else`
- **数据先行**：先统一 `widget + layout` 数据模型，再谈引擎替换
- **视觉不分叉**：统一走 `GridDesktopCardSurface` + token

### 1.1 单路径运行规则（事故回退后）

为避免“交互顺序与渲染顺序不一致”的回归，当前阶段统一采用以下运行约束：

- **运行时唯一真相：`items`**  
  `DesktopGrid` 的渲染顺序、拖拽重排、添加/删除均以 `items` 为准，不允许由 `widgetLayout.widgets` 反向覆盖显示顺序。

- **`widgetLayout` 角色：元数据与策略**  
  `widgetLayout` 当前仅用于持久化/兼容层承载布局与策略信息（如 `compactionStrategy`、`conflictStrategy`、`pinned`），不直接驱动当前单路径渲染。

- **一致性同步要求**  
  当 `items` 更新时，需要同步 `widgetLayout.widgets` 镜像并清理无效 `layout` 条目，避免持久化残留脏引用。

> 说明：后续若重启 RGL 灰度，必须先完成“items 与 widgetLayout 语义重新收敛”的专项改造，再恢复由 `widgetLayout` 驱动渲染。

---

## 2) 目标分层（本阶段）

### 2.1 Layout Schema 层（新增）

职责：

- 统一描述每个组件的布局元数据（`x/y/w/h` 或可迁移等价字段）
- 描述约束（`pinned`、`resizable`、`min/max`）
- 为后续 RGL `Layout[]` 提供一对一映射

建议类型（示意）：

```ts
type WidgetLayout = {
  id: string;      // 对齐 widget.id
  x: number;
  y: number;
  w: number;
  h: number;
  pinned?: boolean;
  resizable?: boolean;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
};
```

### 2.2 Widget Registry 层（新增）

职责：

- 每种 widget 的“定义中心”
- 集中声明：
  - `kind`
  - 默认尺寸
  - 可否拖拽/缩放
  - 外壳变体（tile/panel）
  - 渲染器

建议类型（示意）：

```ts
type WidgetKind = "site" | "group" | "weather" | "calendar" | "todo";

type WidgetDefinition = {
  kind: WidgetKind;
  displayName: string;
  surface: "tile" | "panel";
  defaultLayout: Pick<WidgetLayout, "w" | "h">;
  resizable: boolean;
  pinnedByDefault?: boolean;
  render: (props: WidgetRenderProps) => React.ReactNode;
};
```

### 2.3 Widget Content 层（保留并收敛）

职责：

- 只管业务 UI（天气内容、分组内容、站点内容）
- 不再关心布局求解

规则：

- 不直接写分散玻璃配方
- 外层统一由 registry + surface 决定

### 2.4 Theme 层（延续）

职责：

- 维持浅/深主题 token
- widget 仅消费变量，不写硬编码颜色

---

## 3) 现状不足（已确认）

围绕“添加站点/组件”链路与后续组件扩展，当前主要问题如下：

1. **P0 一致性问题**：目录可添加 `calendar`，但网格渲染层未实现（组件可能添加后不可见）。
2. **P1 硬编码分支问题**：`AddIconSubmitPayload`、`DesktopGrid.handleConfirmAddFromPicker` 仍是 site/component 二元分支，新增 widget 需改多处。
3. **P1 目录与行为耦合**：`ADD_ICON_CATALOG` 仅是静态目录，未承载默认布局/默认配置/创建策略。
4. **P2 插入策略未落地**：`contextSiteId` 贯穿 props 但未参与真实插入逻辑。
5. **P2 测试缺口**：缺少“点击添加后 items 与渲染结果正确”的集成测试。

> 结论：当前链路“可用”，但仍是“为现有两类组件定制”，未形成“可扩展组件添加系统”。

---

## 4) 任务拆分（重构后）

### 阶段 0：先补一致性与回归保护（必须先做）

目标：先把当前功能补齐，避免在重构期间放大问题。

任务：

1. 明确 `calendar` 策略：  
   - 方案 A：先下线 add catalog 中 `calendar`；  
   - 方案 B：补最小 `CalendarCard` 占位渲染（推荐）。
2. 增加添加链路集成测试：  
   - 从 AddIconDialog 触发添加，断言 `DesktopGrid` 渲染项变化。
3. 为 `contextSiteId` 增加 TODO/占位策略测试，明确后续插入语义。

验收：

- 不存在“可添加但不可见”的项
- 添加行为有端到端测试兜底

### 阶段 A：抽创建工厂 + 注册骨架（低风险）

目标：新增组件不再改 `DesktopGrid` 核心分支。

任务：

1. 新增 `widgetTypes.ts`、`widgetRegistry.ts`
2. 新增 `createWidgetFromCatalogEntry(...)`（工厂）
3. `DesktopGrid` 从 `if (site) else widget` 切为工厂调用
4. 给 registry 条目补 `defaultLayout/defaultConfig/surface/resizable`

验收：

- `DesktopGrid` 不再硬编码 widget 创建细节
- 新增 widget 仅需增 registry 条目与内容组件

### 阶段 B：布局 schema 并存迁移（中风险）

目标：引入 `WidgetLayout` 语义，不破坏现网交互。

任务：

1. 新增 `layoutSchema.ts`（`x/y/w/h/pinned/...`）
2. 在状态层引入 `widgets + layout`（与旧结构并存）
3. 新增 `layoutMigration.ts`（旧结构 -> 新结构）
4. 更新 `storage/types.ts` 与 `repository.ts` schema version

验收：

- 加载旧数据可自动迁移
- 页面表现与交互不回退

### 阶段 C：渲染链路 registry 驱动（中风险）

目标：把“类型分支渲染”切到“注册渲染”。

任务：

1. 新增 `WidgetRenderer`
2. `DesktopGrid` 遍历 widget 列表并由 registry 渲染
3. 收敛旧 `GridSiteCard/GridFolderCard/GridWidgetCard` 分支
4. 明确 surface 规范（tile/panel）
5. 合并 `widgetRegistry + widgetBodyRegistry` 为单一中心定义（同源声明 `surface/defaultShape/renderBody`）

验收：

- 站点/分组/天气渲染正确
- 无新增手写视觉配方

### 阶段 D：布局约束落地（高价值）

目标：支持“固定位置不自动补位”等核心需求。

任务：

1. 实现 `pinned`（固定项不被自动补位）
2. 重排策略配置化（`compact` / `no-compact`）
3. 冲突处理标准化（交换/拒绝/挤出）
4. 为上述策略补测试

阶段进展（2026-04）：

- [x] D1 `pinned` 固定项不自动补位
- [x] D2 重排策略配置化（`compact` / `no-compact`）
- [x] D3 冲突处理标准化（`swap` / `reject` / `eject`）
- [x] D4 策略矩阵测试补齐（重排策略 × 冲突策略 × pinned 优先级 × 兼容解析）

验收：

- 固定组件位置稳定、可预测
- 拖拽行为符合策略并有测试覆盖

### 阶段 E（可选）：迁移到 RGL

前置：0/A/B/C/D 稳定后推进。

任务：

- `WidgetLayout` 映射到 `react-grid-layout`
- 先灰度单页再全量切换

阶段进展（2026-04，事故回退后重评）：

- [x] E0 迁移准备：新增 RGL 适配层（`WidgetLayout <-> RGL Layout[]`）与 feature flag（默认关闭）
- [ ] E1 单页灰度接入：**已回退（暂不启用）**。当前运行时恢复为单路径 CSS Grid + 现有 DnD。
- [ ] E2 多页全量切换与回归验证：**未完成（等待 E1 稳定后重启）**。

> 说明（当前真实状态）  
> - 目前主链路以 `items` 交互为主，`DesktopGrid` 不再运行 RGL 分支。  
> - `WidgetLayout`/策略字段（`compactionStrategy`、`conflictStrategy`、`pinned`）仍保留在数据与持久化层，作为后续恢复灰度的基础。  
> - 后续若重启 E1/E2，先完成“单路径稳定 + 状态语义统一（items 与 widgetLayout 对齐）”，再做灰度接入。

---

## 5) 文件级改动建议（首批）

建议新增：

- `src/app/components/widgets/widgetTypes.ts`
- `src/app/components/widgets/widgetRegistry.ts`
- `src/app/components/widgets/WidgetRenderer.tsx`
- `src/app/components/widgets/layoutSchema.ts`
- `src/app/components/widgets/layoutMigration.ts`

建议调整：

- `src/app/components/DesktopGrid.tsx`
- `src/app/storage/types.ts`
- `src/app/storage/repository.ts`
- 对应测试文件（持久化 + 渲染 + 拖拽约束）

---

## 6) 风险与控制

- 风险：双结构并存期间复杂度上升  
  控制：限定过渡期，仅保留一条转换链路

- 风险：拖拽行为回归  
  控制：优先补测试（重排、合并、固定组件不补位）

- 风险：视觉风格回退  
  控制：强制 surface 走统一组件，禁止新增手写玻璃样式

---

## 7) 成功标准

- 新增一个 widget 不再改动多处分支，仅需“注册 + 内容组件”
- 添加链路不存在“可添加但不可见”项（如 calendar）
- 布局数据具备 `x/y/w/h + 约束` 语义
- `pinned` 组件不会被自动补位
- 主题切换下各 widget 可读性与层级关系稳定

