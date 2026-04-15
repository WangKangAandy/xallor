# 整理模式可执行技术方案（状态机 + 事件流 + 文件改动清单）

## 0. 目标与边界

前置阅读：

- [`current-structural-gaps.md`](./current-structural-gaps.md)（当前结构性不足与开工门槛）
- [`widget-system-minimal-refactor-plan.md`](./widget-system-minimal-refactor-plan.md)（单路径运行规则与阶段状态）

目标：新增“整理模式（Arrange Mode）”，支持多选、批量删除、批量移动，并在整理模式下保留基础能力（拖拽换序、文件夹尺寸调整、跨页切换）。

边界：

- 这是页面内交互能力，不做系统级锁定（不阻止切应用）。
- 与当前单路径网格（CSS Grid + DnD）兼容，不重启 RGL 迁移。
- 分阶段上线，先做稳定闭环，再扩展高级交互。

---

## 1. 核心原则

1. 单一路径：整理模式不引入第二套布局引擎。
2. 状态集中：整理模式会话状态独立管理，避免散落在多个组件。
3. 能力叠加：整理模式是“增强层”，不破坏现有基础能力。
4. 可回退：每阶段都可独立验证与回滚。

---

## 2. 状态机设计

## 2.1 顶层状态

`Idle`（普通模式）  
`Arrange`（整理模式）

## 2.2 Arrange 子状态

- `Arrange.Browse`：整理模式空闲态（可点选、可单拖拽、可调尺寸）
- `Arrange.Selecting`：框选/滑选进行中
- `Arrange.DraggingBatch`：批量拖拽进行中
- `Arrange.PageTransition`：拖拽跨页切换中（边缘悬停或滚轮）

## 2.3 状态转移（关键）

- `Idle --(右键菜单:进入整理模式)--> Arrange.Browse`
- `Arrange.Browse --(空白按下并移动)--> Arrange.Selecting`
- `Arrange.Selecting --(释放鼠标)--> Arrange.Browse`
- `Arrange.Browse --(拖拽已选项)--> Arrange.DraggingBatch`
- `Arrange.DraggingBatch --(进入垃圾区并释放)--> Arrange.Browse + 批量删除`
- `Arrange.DraggingBatch --(释放到目标容器/页面)--> Arrange.Browse + 批量移动`
- `Arrange.* --(Esc/完成按钮)--> Idle`

---

## 3. 数据模型

新增整理模式会话状态（建议挂在 `useMultiPageGridPersistence` 所在层的 UI 状态中，不落库）：

```ts
type ArrangeSessionState = {
  isArrangeMode: boolean;
  selectedIds: Set<string>; // 统一选择集，支持桌面项 + 文件夹内项（复合 id）
  selectionAnchorId?: string; // shift 扩展可选
  draggingIds: string[]; // 当前批量拖拽集合
  isSelecting: boolean;
  selectionRect?: { x: number; y: number; w: number; h: number };
  trashZoneActive: boolean;
  activePageId: string;
};
```

ID 规范建议：

- 桌面项：`item:{pageId}:{itemId}`
- 文件夹内项：`folder-item:{pageId}:{folderId}:{siteUrlHash}`

这样可确保“文件夹内外统一选中”时无冲突。

---

## 4. 事件流（Event Flow）

## 4.1 进入整理模式

1. 右键图标或空白触发 Context Menu
2. 点击“整理模式”
3. 触发 `enterArrangeMode()`：
   - `isArrangeMode=true`
   - `selectedIds.clear()`
   - UI 开启动画（页面轻缩 + 露出右页边）

补充约束（已接线）：

- 图标区域右键菜单：`删除图标 + 整理模式`
- 空白区域右键菜单：仅 `整理模式`（不展示删除）

## 4.2 单选/多选

1. 点击圆点：`toggleSelect(id)`
   - 若为外层文件夹：等价为批量选择其全部内部图标（再次点击则批量取消）。
   - 外层文件夹圆点后续采用三态：空（0）/ 半选（部分）/ 全选（全部）。
   - 文件夹结构约束：仅 `sites.length >= 2` 保留为文件夹；`1` 自动退化为站点，`0` 自动删除容器。
2. 框选：空白按下 -> 鼠标移动更新 `selectionRect` -> 命中集增量更新
3. 释放鼠标：`isSelecting=false`

## 4.3 批量删除

1. 已有多选时拖动任意已选项 -> `startBatchDrag(selectedIds)`
2. 顶部垃圾区出现并高亮命中
3. 释放到垃圾区 -> `deleteSelected()`
4. 清理无效选择 + 退出拖拽态

## 4.4 批量移动

1. 拖动任意已选项，自动携带 `selectedIds`
2. 释放到目标：
   - 桌面空位：同页重排落位
   - 文件夹：批量入文件夹
   - 页面边缘：触发跨页切换并落位
3. 保持整理模式，不清空选择（可配置）

## 4.5 整理模式保留基础功能（本需求强调）

- 拖拽切换顺序：保留现有 `useGridDnD` 排序能力
- 文件夹大小调整：保留现有 resize 逻辑
- 页面切换：保留现有滚轮逻辑，并新增拖拽边缘切页

说明：整理模式下这些功能优先级如下：
1) 正在框选 > 2) 批量拖拽 > 3) 单项拖拽/resize

---

## 5. 视觉与交互规范

1. 整理模式视觉：
   - 主页面 `scale(0.95~0.97)`
   - 右侧露出下一页边缘（提示可切页）
   - 图标轻微“呼吸/摇摆”动画（低振幅）
2. 图标角标：
   - 右上圆点：选择态
   - 左上叉号：单个删除
3. 顶部垃圾区：
   - 平时隐藏，拖拽时出现
   - 命中高亮 + 吸附反馈

---

## 6. 分阶段实施计划（可执行）

### 6.0 小步快跑执行原则（本轮）

- 单次只推进 1 个最小任务（可在 1 次提交内验证）。
- 每个任务必须有明确回滚边界（不跨越多个系统层）。
- 每个任务完成后至少执行：`typecheck + 对应最小测试`。
- 若出现行为异常，先回滚到上一步，再定位，不叠加补丁。

### 6.1 Phase A-0（基础接线，不改行为）清单

- [x] A0-1 新增 `arrangeTypes.ts`（会话状态与初始值）
- [x] A0-2 新增 `useArrangeSession.ts`（reducer + action + hook）
- [x] A0-3 新增 `useArrangeSession.test.ts`（状态流转最小单测）
- [x] A0-4 将右键菜单“整理模式”入口 action 接到会话层（先不改 UI 表现）
- [x] A0-5 在 `DesktopGrid` 注入会话实例（仅透传，不改变现有交互）

### 6.1.1 当前结构治理增量（会话层/命令层轻拆，进行中）

已落地（本轮）：

- [x] 新增 `arrangeCommands.ts`，先统一 **selectable-id 映射** / **批量删除入口**（`deleteItemsByArrangeSelection`）。
- [x] 新增 `parseFolderSiteArrangeId`，把复合 id 反解收敛到 `arrangeItemIds.ts`，避免组件层自行解析。
- [x] `DesktopGrid` 中 folder 选择切换改为走命令层（`shouldSelectAllIds`）。
- [x] 整理模式下补 `Delete/Backspace` 批删入口，统一走命令层删除。
- [x] 补充命令层与 id 解析测试：`arrangeCommands.test.ts`、`arrangeItemIds.test.ts`。

未完成（下一步门槛）：

- [ ] `useArrangeSession` 仍在 `DesktopGrid` 内部创建，尚未上提到条带/页面上层（跨页会话共享前置）。
- [ ] `moveSelected` 命令层尚未建立；`useGridDnD` 仍承载大量 drop 业务分支（B2/C 风险点）。
- [ ] 编排级回归测试（B1-4/B2-4）尚未补齐。

临时策略（用于处理中途插单问题）：

- 当前可继续小步修复与局部功能迭代；**暂不进入 B2/C 深水功能**（批量移动/跨页移动）直到上述三项门槛至少完成前两项。

## Phase A（整理模式最小闭环）

- 进入/退出整理模式
- 圆点单选 + 框选
- 左上叉单删
- 批量拖到垃圾区删除
- 保留单项拖拽换序、文件夹 resize

### Phase A-1 小步任务（当前）

- [x] A1-1 整理模式 UI 壳：卡片右上圆点、左上叉号、右上角退出 X 按钮 + `Esc` 退出（仅 UI，不改批量逻辑）
- [x] A1-2 圆点单选行为接线（点击切换 `selectedIds`，维持单页；拦截 pointer down 防止误触拖拽/打开）
- [ ] A1-3 左上叉单删行为校验（整理模式下删除当前项）
- [x] A1-4 键盘批删接线（`Delete/Backspace` -> `deleteItemsByArrangeSelection`）

验收：

- 整理模式可稳定进入/退出
- 批删链路可用且无误删
- 基础拖拽、resize 不回退

## Phase B（批量移动）

### Phase B-1 小步任务（框选最小闭环）

- [x] B1-0 非整理模式空白区框选触发：按下空白区拖拽形成矩形；仅当命中 >=1 项时自动进入整理模式并初始化选择；命中为 0 时不触发整理模式
- [x] B1-1 框选状态机接线（`idle -> selecting -> settled`），仅作用当前页
- [x] B1-2 新增 `selectionMath.ts`，实现矩形与卡片包围盒相交命中
- [x] B1-3 在 `DesktopGrid` 接入最小框选链路（按下空白区开始、移动更新、抬起提交）
- [ ] B1-4 增加最小回归测试（状态流转 + 命中计算 + 不干扰现有单项拖拽）

### Phase B-2 小步任务（批量移动到同页/文件夹）

- [ ] B2-1 批量拖拽到同页目标（保持相对顺序）
- [ ] B2-2 批量拖拽到已有文件夹（统一命令入口）
- [ ] B2-3 文件夹展开态中继续选择（不退出整理，选择集一致）
- [ ] B2-4 批量移动回归测试（外部 + 文件夹内部混合集）
- [ ] B2-5 将 `moveSelected` 从 `useGridDnD` 业务分支中抽离到命令层（为 C 阶段跨页复用）

验收：

- 内外选择集统一生效
- 批量移动与单项移动结果一致且可预测

## Phase C（跨页与首页调整）

- 拖拽边缘悬停切页
- 保留滚轮切页
- “设为首页”能力（原首页右移）

验收：

- 跨页移动无丢失/重复
- 首页重排后顺序正确

## Phase D（稳定性与性能）

- 大量图标下框选性能优化（rAF/throttle）
- 复杂路径回归测试（文件夹内外 + 跨页 + 批删）

---

## 7. 文件改动清单（建议）

新增：

- `src/app/components/arrange/arrangeTypes.ts`
- `src/app/components/arrange/useArrangeSession.ts`
- `src/app/components/arrange/arrangeCommands.ts`（选择映射/批删命令；后续承接批移）
- `src/app/components/arrange/ArrangeOverlay.tsx`（垃圾区、模式工具条、页面缩放壳）
- `src/app/components/arrange/selectionMath.ts`（框选命中）
- `src/app/components/arrange/batchDragModel.ts`
- `src/app/components/arrange/__tests__/...`

改造：

- `src/app/components/DesktopGrid.tsx`
  - 接入 `isArrangeMode`
  - 保留现有 DnD/resize，增加多选拖拽分支
- `src/app/components/DesktopGridItem.tsx`
  - 渲染圆点/叉号
  - 整理模式视觉态
- `src/app/components/DesktopGridFolderPortal.tsx`
  - 文件夹内选择集接入
- `src/app/components/MultiDesktopStrip.tsx`
  - 整理模式下页面缩放与露边
- `src/app/components/useDesktopStripWheel.ts`
  - 整理模式滚轮策略联动
- `src/app/components/useMultiPageGridPersistence.ts`
  - 增加首页重排 action（可持久化）

测试：

- `src/app/components/useGridDnD.reorder.test.ts`（整理模式回归）
- `src/app/components/useMultiPageGridPersistence.test.ts`（首页重排）
- `src/app/components/arrange/arrangeCommands.test.ts`（选择映射 + 批删）
- `src/app/components/arrange/arrangeItemIds.test.ts`（复合 id 解析）
- 新增 `arrange` 目录测试（框选、批删、批移、跨页）

---

## 8. 与当前系统的兼容要求

1. 不破坏现有“添加图标/组件”流程。
2. 不改变现有 `widgetLayout` 元数据角色（当前仍以 `items` 为运行时真相）。
3. 整理模式默认关闭，不影响普通用户路径。

---

## 9. 风险与防护

风险：

- 多选拖拽与现有 DnD 冲突
- 文件夹内外统一选择导致 ID 处理错误
- 跨页过程中状态丢失

防护：

- 统一命令层（select/move/delete）避免散改
- 关键路径加回归测试
- 分阶段灰度开关（仅整理模式）

---

## 10. 验收标准（Definition of Done）

1. 整理模式下可稳定执行：单删、批删、批量移动（含文件夹）。
2. 保留基础能力：单项拖拽换序、文件夹调整尺寸、滚轮切页。
3. 跨页移动与首页调整行为可预测、可回归。
4. 关键交互具备自动化测试覆盖。

