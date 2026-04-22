# 路线图与维护焦点

本文档保持**简短**：记录仍值得跟进的缺口；**已完成的 v1/v2 工程项**见下文「归档指针」，不再逐条罗列。

**当前阶段**：以**维护与重构**为主，优先**优化代码结构、边界与可测试性**，降低后续加交互/装饰层时的重构成本；不急于堆业务功能。

**优先级说明**：下文 **「高」专指工程结构债务**（拖延会显著抬高日后重构代价）。**外链、弱网、资源策略**属于**体验与运行环境**，与「结构高优」分列，避免和可扩展性目标混淆。

**排期说明**：下列「缺口」含**可持续跟进的工程项**与**面向未来的能力占位**（弱网、未来 API、上架等）；**未标注「紧迫」的不等于当前线上已有对应缺陷**，而是降低日后返工与体验风险的**提前约束**。

---

## 归档指针（已完成，详情见链接）

| 主题 | 说明 |
|------|------|
| 本地持久化 | [`persistence-architecture.md`](./persistence-architecture.md)、[`src/app/storage/`](../src/app/storage/) |
| MV3 新标签页 | [`public/manifest.json`](../public/manifest.json) + `vite.config.ts` 的 `base: './'`；扩展根目录用构建产物 **`dist/`** |
| 体积与结构拆分 | [`v2-volume-and-maintainability.md`](./v2-volume-and-maintainability.md)（含构建基线） |
| 工程基线 | 根目录 `tsconfig.json`、`eslint.config.js`；CI：[`../.github/workflows/ci.yml`](../.github/workflows/ci.yml) |
| UI 极简布局（v1） | [`minimal-layout-mode.md`](./minimal-layout-mode.md)；实现：`src/app/preferences/`、`SettingsSpotlightModal`、E2E [`e2e/minimal-layout.spec.ts`](../e2e/minimal-layout.spec.ts) |
| 链接打开方式（v1） | [`notes/navigation-behavior-layer.md`](./notes/navigation-behavior-layer.md)；实现：`src/app/navigation/`、`useUiPreferences`（`xallor_ui_open_links_in_new_tab`）、`SearchBar` / 网格站点与文件夹 |
| 隐藏图标空间（v1） | [`notes/hidden-icons-space-plan.md`](./notes/hidden-icons-space-plan.md)；实现：`src/app/hiddenSpace/useHiddenSpace.ts` + `SettingsSpotlightModal` 隐私空间流程 |
| 空白区右键下载壁纸（v1） | [`notes/download-wallpaper-context-menu-plan.md`](./notes/download-wallpaper-context-menu-plan.md)；实现：`src/app/components/feedback/downloadWallpaper.ts`、`useGridBackgroundContextMenu.tsx` |

---

## 仍存在的缺口

### 当前结构快照（2026-04）

- **设置域 P0 拆分已收尾**：`SettingsSpotlightModal.tsx` 已收敛为壳层编排；分区面板、隐私弹窗与状态逻辑已拆到独立组件/hook（`SettingsSpotlightPanels.tsx`、`SettingsHiddenSpaceDialog.tsx`、`useHiddenSpaceDialogController.ts`、`useSettingsSectionRouting.ts`）。
- **App 编排层偏厚**：`App.tsx` 同时处理背景右键、下载壁纸、隐藏空间入口、全局消息提示、设置开关串联。
- **网格主链路已拆出骨架，但仍是热点模块**：`DesktopGrid.tsx` 仍聚合 DnD、整理态与文件夹 Portal 交互。
- **文档总体齐全，但状态漂移风险仍在**：已有计划与实现速度不一致，需持续清理“文档 TODO 与代码现状”偏差。

### 高（结构 / 可扩展，优先执行）

- **P0：设置模块瘦身（首要）**
  - 目标：把 `SettingsSpotlightModal.tsx` 从“巨型组件”收敛为“壳层 + 分区路由”。
  - 进度（已完成）：`general/privacy/appearance/about/widgets` 分区已迁出主文件，主文件职责集中为路由编排；隐私弹窗已独立为 `SettingsHiddenSpaceDialog`；新增 `useHiddenSpaceDialogController` 与 `useSettingsSectionRouting` 承接状态机与搜索路由，并已补齐 hook 级单测（`useHiddenSpaceDialogController.test.tsx`、`useSettingsSectionRouting.test.tsx`）。
  - 下一步（转 P1 优化）：在不影响交互稳定性的前提下，按需抽离设置域共享 UI primitives（如行级开关/滑杆）并评估跨面板复用边界。
  - 约束：拆分不改变现有交互行为与 test id；每个拆分阶段都保持回归测试通过。

- **P0：设置搜索 MVP 落地**
  - 方案文档：[`notes/settings-search-implementation-plan.md`](./notes/settings-search-implementation-plan.md)。
  - 进度（已完成）：已接入受控输入、轻匹配、分区定位、无结果空态、搜索触发时浮层收口；实现入口：`settingsSearch.ts` + `useSettingsSectionRouting.ts`。
  - 后续增强（非 P0）：结果高亮、关键词治理与排序优化、键盘候选导航。

- **P1：App 编排层解耦**
  - 进度（本轮已完成子项）：已抽离背景菜单与下载行为（`useDesktopBackgroundActions.ts`）、全局提示状态机（`useAppMessageState.ts`）与提示弹窗分发容器（`AppMessageDialogs.tsx`）、隐藏请求领域逻辑（`useHideItemRequest.ts`）；设置弹窗打开/关闭与分区跳转指令已收敛为 `useSettingsModalController.ts`；`SettingsSpotlightModal` 入参已收敛为 `settingsState + settingsActions` 适配层（`useSettingsSpotlightBindings.ts`），并进一步由 `useSettingsDesktopIntegration.ts`、`useAppContentController.ts` 统一桥接到桌面网格与页面壳层；`App.tsx` 已从“内联流程实现”收敛为“依赖装配 + 渲染结构”。
  - 回归保障：新增/更新单测覆盖上述拆分链路（`useDesktopBackgroundActions.test.ts`、`useAppMessageState.test.tsx`、`useHideItemRequest.test.ts`、`useSettingsModalController.test.tsx`、`useSettingsSpotlightBindings.test.tsx`、`useSettingsDesktopIntegration.test.tsx`、`App.sidebar-layer.test.tsx`）。
  - 测试稳定性：`App.sidebar-layer.test.tsx` 已通过缩小渲染面（mock 非目标重组件）消除 `EnvironmentTeardownError` 噪声；判定为测试 harness 稳定性问题而非业务逻辑回归。
  - 下一步（建议）：继续以 adapter 方式压缩设置域跨层传参（如将设置域内部回调组合为稳定动作集合），并在不改变交互语义前提下逐步降低 `App.tsx` 对设置细节的感知面。
  - 目标：`App.tsx` 保留页面壳与跨域挂载，不再承载细粒度业务分支。

- **P1：交互系统契约收敛**
  - 蓝图：[`notes/interaction-system-blueprint.md`](./notes/interaction-system-blueprint.md)。
  - 命中契约：[`notes/context-menu-surface-contract.md`](./notes/context-menu-surface-contract.md)。
  - 当前焦点：整理态下右击退出的一致性规则 + E2E 边界回归。

- **P1：整理模式开工前置治理（持续）**
  - 前置文档：[`current-structural-gaps.md`](./current-structural-gaps.md)。
  - 实施方案：[`arrange-mode-technical-plan.md`](./arrange-mode-technical-plan.md)。
  - 重点：补齐批量移动与跨页手势回归，避免交互迭代时反复返工底层状态机。

### 中（体验与工程质量，跟进推进）

- **搜索体验补全**
  - 搜索输入联想（autocomplete/suggestion）与站内图标联想能力尚未实现。
  - 自定义搜索引擎仅支持新增与选择，尚缺删除与回退兜底流程。

- **设置搜索体验增强**
  - 继续补全结果高亮与关键词维护机制，减少模糊输入下的跳转偏差。
  - 保持一级分区定位模型，不再引入设置二级导航。

- **多桌面挂载策略优化**
  - 当前 `MultiDesktopStrip` 仍按页完整挂载 `DesktopGrid`。
  - 目标方案：访问过缓存 + 未访问占位，平衡切换体验与内存占用。

- **远程资源加载专项**
  - 方案：[`favicon-load-optimization-plan.md`](./favicon-load-optimization-plan.md)。
  - 已完成策略层与双 consumer 接入，待持续采样 p90 并固化阶段报告。

- **视觉 token 统一**
  - 继续推进毛玻璃与语义色收敛，见 [`glass-theme-unification-plan.md`](./glass-theme-unification-plan.md) 与 [`notes/add-icon-theme-refactor-plan.md`](./notes/add-icon-theme-refactor-plan.md)。
  - 重点从“可用”转向“跨模块一致性与可维护性”。

- **文档与代码一致性治理（新增）**
  - 每次功能落地后同步更新对应计划文档状态，避免 roadmap 与实现偏离。
  - 汇总入口：`docs/notes/docs-todo-audit-2026-04-22.md`（按阶段持续更新）。

### 低（多在上架或接真实数据时）

- Manifest `icons`、商店素材；天气等接 API 时的权限与隐私文案。
- **安全**：自定义搜索引擎 URL 若完全开放，需防开放重定向（上架相关）。

---

## 扩展原则（面向后续功能，非实现承诺）

以下不绑定具体排期，仅约束方向，避免将来加「宠物 / 装饰层」时把主网格拖垮：

1. **分层**：背景 → 主内容（搜索 + 网格）→ **可选覆盖层**（角色、粒子等）应独立组件 + 明确 `z-index`；**覆盖层组件待有产品需求再实现即可**。App 与 `desktopGridLayers.ts` 已区分主内容与弹层 z-index；尽量不往 `DesktopGridItem` 内塞全局副作用（与当前实现一致）。
2. **坐标与 DOM**：网格项位置若需被外部引用（例如「蹲在图标上」），优先通过 **ref / 回调暴露几何信息** 或集中 **layout store**，避免到处 `querySelector`。
3. **动画**：已用 Motion 的 `layout="position"`；新增全页动画时注意性能与 `react-dnd` 预览层冲突，可单独里程碑处理。
4. **状态**：持久化继续走 `storage/repository`；纯 UI 装饰状态可与网格数据解耦，便于测试与回滚。

---

## 相关文件

| 文件 | 作用 |
|------|------|
| [`v2-volume-and-maintainability.md`](./v2-volume-and-maintainability.md) | 构建基线、历史拆分与后续可选任务 |
| [`grid-interaction-boundaries-plan.md`](./grid-interaction-boundaries-plan.md) | 网格 DnD/层级/文件夹视图模型拆分计划与进度参照 |
| [`arrange-mode-technical-plan.md`](./arrange-mode-technical-plan.md) | 整理模式状态机、事件流、分阶段实施与文件改动清单 |
| [`current-structural-gaps.md`](./current-structural-gaps.md) | 开工整理模式前的结构性不足与治理门槛 |
| [`glass-theme-unification-plan.md`](./glass-theme-unification-plan.md) | 毛玻璃 token + `GlassSurface` 渐进统一 |
| [`favicon-load-optimization-plan.md`](./favicon-load-optimization-plan.md) | 远程资源策略层（Favicon 首期）与缓存/加载加速计划 |
| [`notes/hidden-icons-space-plan.md`](./notes/hidden-icons-space-plan.md) | 隐藏图标空间：开启/关闭状态机、密码流程、批量操作与极简模式约束 |
| [`notes/settings-search-implementation-plan.md`](./notes/settings-search-implementation-plan.md) | 设置搜索：索引模型、匹配与定位策略、分阶段交付与测试清单 |
| [`notes/context-menu-surface-contract.md`](./notes/context-menu-surface-contract.md) | 右键命中契约：实体优先、最近命中优先、空白兜底与输入语义保留 |
| [`notes/interaction-system-blueprint.md`](./notes/interaction-system-blueprint.md) | 交互系统蓝图：命中层、阻断层、状态层与跨文档约束关系 |
| [`notes/download-wallpaper-context-menu-plan.md`](./notes/download-wallpaper-context-menu-plan.md) | 空白区右键“下载壁纸”：媒体无关下载、回退策略、负向测试与实施步骤 |
| [`minimal-layout-mode.md`](./minimal-layout-mode.md) | 极简布局模式：主区仅搜索、侧栏不变；`layoutMode` 与分层约定 |
| [`notes/navigation-behavior-layer.md`](./notes/navigation-behavior-layer.md) | 外链打开方式：`openExternalUrlImpl`、`useOpenExternalUrl`、存储与整理边界 |
| [`package.json`](../package.json) | `build` / `typecheck` / `lint` / `test:run` |
