# 网格 / 交互边界优化计划

**路线图总览**见 [`project-gaps-and-roadmap.md`](./project-gaps-and-roadmap.md)（「网格与交互边界」缺口）。

目标：在**不改变产品行为**的前提下，收紧职责边界、便于后续加覆盖层（装饰、宠物等）与测试。原则：**小步提交、每步可回滚、每步 `npm run test:run` + 手动 smoke**。

---

## 现状（简要）

| 区域 | 位置 | 问题 |
|------|------|------|
| 合并 / 重排 / drop | `DesktopGridItem` 内 `useDrop`（hover 中心区、300ms 定时器、`onReorder` 改写 `index`） | 与视图混在同一组件，难单测 |
| 拖拽 | 同文件 `useDrag` | 同上 |
| 缩放 | `useFolderResize` | 已抽出，较好 |
| 文件夹预览布局 | `folderPreviewLayout.ts` + `DesktopGridItem` 内大块计算 → `FolderTileChrome` | 计算与渲染仍耦在同一组件 |
| 层级 | `motion.div` 上 `zIndex`，文件夹弹层 `z-[100]` | 未形成文档化的「层级表」，后续加全页层易冲突 |

---

## 阶段 0：约定与文档（0.5～1 天）

**产出**：避免后续改一处踩一片。

1. **层级约定（写在代码注释 + 本文）**  
   - 例：背景 `z-0`、主内容 `z-10`、网格卡片 `z-10～30`（拖拽/合并目标）、侧栏 `z-20`、文件夹弹层 `z-100`、**预留**全页覆盖层 `z-50～90` 或 `z-[200]`（按你是否要压在弹层之上）。  
   - `App.tsx` / `DesktopGrid` 根节点用注释标一层。

2. **DnD 数据契约**  
   - `GridDnDDragItem` + `react-dnd` 的 `item` 形状（含 `folder-site`、`index` 可变）在 [`desktopGridDnDTypes.ts`](../src/app/components/desktopGridDnDTypes.ts) 或旁注中写清**各分支读哪些字段**。

**验收**：新人读注释能知道「新层插在哪」；不改行为。

---

## 阶段 1：抽出「放置目标」逻辑（1～2 天）

**目标**：`DesktopGridItem` 只负责组装，**合并意图 / 中心判定 / 重排触发**进独立 hook。

1. 新增 `useGridItemDropTarget`（名称可调整），入参大致包括：  
   `itemId`、`index`、`onReorder`、`onHoverMergeIntent`、`onClearMergeIntent`、`onDropItem`  
   内部保留：`mergeTimerRef`、`hasEnteredCenterRef`、`useDrop` 整段逻辑。

2. `DesktopGridItem` 改为调用该 hook，**行为与阈值（0.2 边区、300ms）保持不变**。

3. **可选**：把「是否中心区域」抽成纯函数  
   `isCenterZone(rect, clientX, clientY, marginRatio)`，配 1～2 个单测。

**验收**：交互与现网一致；`DesktopGridItem` 行数明显下降。

---

## 阶段 2：抽出「拖拽把手」逻辑（0.5～1 天）

**目标**：`useDrag` 与 `drag(drop(ref))` 合并方式集中在一处。

1. 新增 `useGridItemDrag`：`item`（id/type/index）、`ref`，返回 `{ dragProps, isDragging }` 或与 drop hook 协调的 ref 组合方式。

2. 注意：**ref 合并顺序**（`drag(drop(ref))`）保持不变。

**验收**：拖拽表现不变。

---

## 阶段 3：文件夹视图模型与渲染分离（1～2 天）

**目标**：大段 `if (item.type === 'folder')` 内的计算迁到 **纯函数**，组件只负责 `chrome = fn(...)` + JSX。

1. 新增例如 `buildFolderGridChrome(args): FolderTileChrome`（或拆成 `computeFolderItemViewModel`），入参包括：  
   `item`（FolderItem）、`renderSize`、`resizePreview`、`resizeFolderStartRef` 当前值、`resizeFolderPending`、`activeResizeDir` 等。

2. `DesktopGridItem` 内文件夹分支缩成十余行：调纯函数 → `<DesktopGridItemFolderBody chrome={...} />`。

3. 对纯函数补 **1～2 个快照/边界单测**（与现有 `folderPreviewLayout.test` 风格一致）。

**验收**：文件夹缩放、预览格数、打开弹层行为不变。

---

## 阶段 4（可选）：按类型拆壳组件

**目标**：进一步降低单文件认知负担；**仅在阶段 1～3 稳定后再做**。

1. `DesktopGridItem` 变为薄路由：`item.type === 'site' | 'folder' | 'widget'` 分别渲染 `GridSiteCard` / `GridFolderCard` / `GridWidgetCard`。

2. 共享逻辑（Motion 外壳、drop/drag hooks）通过**组合子组件**或**共享 hook**复用，避免复制粘贴。

**验收**：无行为变化；按需做 Story 或仅手工回归。

---

## 阶段 5（可选）：为「外部层」预留布局信息

**目标**：若未来要做「蹲在图标上」「页面底部跑动」，需要**可读的几何信息**，而不是全页 `querySelector`。

1. **轻量方案**：`DesktopGrid` 用 `ResizeObserver` + `ref` 收集每个 item 的 `DOMRect`（id → rect），通过 **React Context** 向下传只读 `getItemRect(id)`（注意节流与列表变更时失效）。

2. **更重方案**：独立 `layoutStore`（Zustand 等）——仅当交互真的需要时再引入。

**验收**：默认可不启用消费方；网格现有功能不受影响。

---

## 风险与规避

- **react-dnd 与 ref**：拆 hook 时最容易踩 ref 未合并，应用现有行为对照测试。  
- **Motion `layout`**：外层 `motion.div` 属性尽量不动，避免子项拉伸回归。  
- **合并意图**：改动 `useGridDnD` / clear 逻辑时跑 `useGridDnD.mergeIntent.test.ts` 类用例。

---

## 建议顺序

`阶段 0 → 1 → 2 → 3 →（视需要 4）→（有明确需求再做 5）`

完成阶段 1～3 后，**网格/交互边界**在结构上已明显清晰，后续加宠物层主要对接 **阶段 0 的层级 + 阶段 5 的几何（若做）**。

---

## 执行记录（仓库内）

| 阶段 | 状态 | 实现要点 |
|------|------|----------|
| 0 | 已落地 | `desktopGridLayers.ts`、`desktopGridDnDTypes.ts` 契约注释；`App.tsx` / `DesktopGrid.tsx` / `DesktopGridFolderPortal.tsx` 层级注释；`GRID_DND_*` 常量见 `desktopGridConstants.ts` |
| 1 | 已落地 | `useGridItemDropTarget.ts`、`gridItemDnDHelpers.ts`（`isCenterZone`）+ `gridItemDnDHelpers.test.ts` |
| 2 | 已落地 | `useGridItemDrag.ts`；`DesktopGridItem` 内仍为 `drag(drop(ref))` |
| 3 | 已落地 | `buildFolderGridChrome.ts` + `buildFolderGridChrome.test.ts` |
| 4 | 已落地 | `GridSiteCard` / `GridFolderCard` / `GridWidgetCard` + `useGridItemCard` + `GridItemCardFrame`；`DesktopGridItem` 仅路由 |
| 5 | 未做 | 按需排期 |
