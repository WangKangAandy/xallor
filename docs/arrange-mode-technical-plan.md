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

**细化与可验收条款**（布局壳、动效、手势、与 B2 顺序）见 **§5.1**。

---

## 5.1 整理模式「桌面编辑壳」视觉（对齐参考）

本节为**规划与验收口径**：具体实现方式（组件名、动画参数）后续单独立项时再定，此处先把目标与约束写死，避免与现有 `MultiDesktopStrip` 横向条带、框选手势冲突。

### 5.1.1 布局壳（可验收）

- **触发条件**：`isArrangeMode === true` 时，对**当前页在视口内的呈现区域**施加「编辑态」外壳（实现载体可为 `MultiDesktopStrip` 内包一层 `ArrangeModeChrome`，或等价布局容器；名称不绑定实现）。
- **缩放**：当前页内容相对正常态**收缩一定比例**（与 §5 中 `scale(0.95~0.97)` 一致或在该区间内取定标），验收时以设计稿或约定数值为准。
- **阴影**：当前页编辑区域需有**可辨别的投影/层次**（与背景区分），避免「缩了但贴底」；是否叠加描边、圆角为**可选**，需在验收清单中勾选是否启用。
- **邻页露边**：
  - **左侧、右侧**相邻桌面均需露出一定宽度的「边条」（像素或视口百分比在实现前锁一版数值）。
  - 需明确：露边是**仅装饰提示**，还是**可点击/可拖拽切页的热区**（若仅装饰，切页仍走现有滚轮/后续 Phase C 边缘逻辑）。
- **与横向条带的联动**（避免打架）：
  - 现有 `MultiDesktopStrip` 使用整条 `translateX` 切换页面；编辑壳的 `scale`/阴影/露边必须与条带位移**在层级与时间轴上可组合**，验收标准包括：
    - 切页动画进行中，编辑壳不闪断、不双重缩放；
    - 整理模式开启/关闭时，条带与壳的过渡可预测（无布局抖动或 z-index 错乱）。

### 5.1.2 图标动效（可验收）

需在产品层二选一或组合，**实现前锁定**，避免同时上多种动效导致性能与干扰：

| 模式 | 含义 | 验收要点 |
|------|------|----------|
| **A. 持续呼吸** | 整理模式期间图标保持轻微周期性动效（低振幅） | 全页图标节奏一致或可接受轻微错相；不与拖拽、框选命中冲突 |
| **B. 进入时一次性同步 jiggle** | 进入整理模式后触发**一段短时、全员同步**的摆动/抖动（类似「编辑态入场」） | 有明确起止时间；结束后回到静态或可衔接 A |

**技术约束（规划）**：

- 实现路径需在 **Motion（含 `layout`）** 与 **纯 CSS `@keyframes`** 之间择一或分层（例如壳用 CSS、图标用 Motion）；禁止在未评估的情况下对大量节点同时开重度 `layout` 动画。
- **性能上限**：图标数量大时必须有降级策略（例如仅对**视口内**或**首屏可见**网格项播放动效，其余静止或简化），并在验收中注明「N 个图标下仍保持可交互帧率」的粗阈值（如后续由性能里程碑补数字）。

### 5.1.3 切页手势：双指左滑 → 下一页（可验收 / 风险）

- **目标**：在触控环境下，**双指向左滑**等价于「进入下一页」（与现有纵向滚轮切页语义对齐方向约定需单独说明：左滑=下一页还是上一页，此处以产品最终定义为准）。
- **Web 可行性（约束）**：
  - 需评估 `PointerEvent` 多点、`touch` 系列事件在目标环境（桌面 Chrome / 扩展页 / 触控笔记本）下的差异。
  - 必须与 **单指框选**、**单指拖拽图标**、**滚轮切页** 定义**优先级**：例如整理模式下双指仅用于切页，不触发框选；桌面鼠标无「双指」则该手势**不生效或**由别的方式替代。
- **阶段建议**：放入 **Phase C 可选能力**，或 **「仅触控设备 / 实验开关」** 上线，避免与纯鼠标用户路径冲突；验收清单中需包含「关闭该功能时行为与现网一致」。

### 5.1.4 与 Phase B（批量移动）的衔接

- **建议里程碑顺序**：
  1. **先**完成 **「仅视觉壳 + 不切页业务增强」**：即 §5.1.1～§5.1.2 所述进入整理后的缩放/阴影/露边与图标动效（双指滑为 §5.1.3 可选，可后置），**不改变** `useGridDnD` 的批量移动语义。
  2. **再**进入 **B2 批量移动**（`moveSelected`、多选拖拽等），避免视觉壳与拖拽命中区域同时大改导致回归面爆炸。
- **并行策略（若资源允许）**：视觉壳与 B2 可并行，但须约定 **B2 不改壳的几何约束**（或壳改动仅在独立分支合并），且 **不动** 批量逻辑的前提下的合并顺序由分支策略保证。

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
- [x] 统一收敛「点外部关闭」输入模型：新增 `useDismissOnPointerDownOutside`，把 `SearchBar` 与网格右键菜单改为 `pointerdown + capture`；同步将小憩唤醒从 `mousedown` 升级到 `pointerdown`，规避与整理手势 `preventDefault` 的链式冲突。
- [x] 增加跨浏览器回归：`e2e/searchbar-layer.spec.ts` 覆盖「引擎下拉不被遮挡可点选」「点外部可关闭」，并在 Chromium + Edge 双项目通过。

未完成（下一步门槛）：

- [x] `useArrangeSession` 已从 `DesktopGrid` 内部上提到条带层（`MultiDesktopStrip`）统一创建并下发，作为跨页会话共享前置。
- [x] 已新增 `moveDraggedItemByDrop` 命令并接入 `useGridDnD`，将 folder-site/site 的核心 drop 合并分支从 hook 内下沉到命令层；后续在 B2 阶段继续扩展为完整 `moveSelected`（跨容器/跨页批量）语义。
- [ ] 编排级回归测试进行中：B1-4 已落基础 E2E 回归（进入/动态增减/阈值不触发/Delete 批删），B2-4（批量移动外部+文件夹混合集）待补。

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

### Phase A-2（桌面编辑壳，仅视觉与动效）— 建议先于或与 B2 分期并行

对应 **§5.1**。本阶段**不**要求完成批量移动；**不**修改 `useGridDnD` 批量语义（与 §5.1.4 一致）。

- [ ] A2-1 布局壳：`isArrangeMode` 下当前页视口级 `scale` + 阴影（+ 可选圆角）
- [ ] A2-2 邻页露边：左右露边宽度有定标；与 `MultiDesktopStrip` 的 `translateX` 条带无打架（验收 §5.1.1）
- [ ] A2-3 图标动效：在「持续呼吸 / 入场同步 jiggle」中锁定产品方案 + 性能降级策略（验收 §5.1.2）
- [ ] A2-4（可选）双指滑切页：仅当产品采纳 §5.1.3 时立项；默认可走 Phase C 实验开关

验收：

- 进入/退出整理模式时，壳与动效稳定、可回滚
- 现有滚轮切页、框选、单拖仍可用（不因壳单独失效）

## Phase B（批量移动）

### Phase B-1 小步任务（框选最小闭环）

- [x] B1-0 非整理模式空白区框选触发：按下空白区拖拽形成矩形；仅当命中 >=1 项时自动进入整理模式并初始化选择；命中为 0 时不触发整理模式
- [x] B1-1 框选状态机接线（`idle -> selecting -> settled`），仅作用当前页
- [x] B1-2 新增 `selectionMath.ts`，实现矩形与卡片包围盒相交命中
- [x] B1-3 在 `DesktopGrid` 接入最小框选链路（按下空白区开始、移动更新、抬起提交）
- [x] B1-4 增加最小回归测试（状态流转 + 命中计算 + 不干扰现有单项拖拽）
  - 已落地：`e2e/arrange-gesture.spec.ts` 覆盖「空白起手命中进入」「拖动中动态增选/回收取消」「小于阈值不触发」「Delete 批删」。

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
- **（可选，见 §5.1.3）** 触控双指滑切页：与单指框选/滚轮优先级已定；建议实验开关或仅触控设备
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

