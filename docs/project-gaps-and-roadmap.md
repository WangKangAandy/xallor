# 路线图与维护焦点

本文档保持**简短**：记录仍值得跟进的缺口；**已完成的 v1/v2 工程项**见下文「归档指针」，不再逐条罗列。

**当前阶段**：并行两条线——**产品**：壁纸能力与**云端后台服务**（目录/收藏/同步等）为当前开发主轴；**工程**：结构、契约与可测试性继续按需收敛，**不阻塞**壁纸/云端功能迭代。

**优先级说明**：**「产品焦点」**下列为近期交付主线；**「高」仍专指工程结构/契约债务**（可与产品并行，但不必等产品做完再动）。体验类（弱网、资源策略）与结构高优分列。

**排期说明**：缺口中含**可持续工程项**与**能力占位**；未写「紧迫」不等于线上必有缺陷，多为降低返工与合规风险的**提前约束**。

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
| 设置 Spotlight 壳层与分区拆分（v1） | `SettingsSpotlightModal.tsx`（壳层编排）+ `SettingsSpotlightPanels.tsx` / `SettingsHiddenSpaceDialog.tsx` / `useHiddenSpaceDialogController.ts` / `useSettingsSectionRouting.ts`；账户分区 UI：`SettingsAccountPanel.tsx`（占位模型，无登录/同步业务） |
| 设置搜索 MVP（v1） | [`notes/settings-search-implementation-plan.md`](./notes/settings-search-implementation-plan.md)；实现：`settingsSearch.ts`、`useSettingsSectionRouting.ts` |
| App 编排首轮解耦（v1） | `src/app/appShell/`、`useAppContentController.ts` 及配套 hooks 单测；侧栏层测试通过 mock 收窄渲染面稳定 harness |
| DesktopGrid 首轮拆分（v1，小步） | `DesktopGridDropZone.tsx`、`useDesktopGridItemMutations.ts`；**继续拆网格/整理态大块暂缓**，待壁纸/云端里程碑后再排 |

---

## 仍存在的缺口

### 优先级总览（当前）

| 层级 | 含义 | 当前做什么 |
|------|------|-------------|
| **产品焦点** | 近期交付主线 | **壁纸**（设置分区、列表/收藏、与页背景联动）+ **云端后台**（鉴权、API、同步与缓存策略） |
| **高** | 结构热点与契约风险；可与产品并行 | 交互契约与整理态、E2E；`DesktopGrid` 热点治理（**大块拆分暂缓**） |
| **中** | 体验与工程质量；可分期交付 | 搜索与设置搜索增强、多桌面挂载、Favicon/视觉 token、文档同步 |
| **低** | 上架、合规、强依赖真实服务时 | Manifest/商店、账户与壁纸共用云端的鉴权与隐私文案、开放 URL 安全 |

### 当前产品焦点：壁纸与云端后台服务

- **目标（产品）**：用户可从**设置「壁纸」分区**（及与外观/背景的衔接）浏览或同步**云端壁纸库**；支持收藏、应用为当前新标签背景、多设备同步等能力按版本迭代；弱网/失败时有明确降级（本地图、缓存、文案）。
- **现状（代码）**：设置内已有「壁纸」分区（图库/筛选/预览占位与本地上传**静态图**）；**动态/本地视频**尚未接入，方案见 [`notes/wallpaper-dynamic-local-and-cloud-plan.md`](./notes/wallpaper-dynamic-local-and-cloud-plan.md)。外观页壁纸块与空白区右键下载见 [`notes/download-wallpaper-context-menu-plan.md`](./notes/download-wallpaper-context-menu-plan.md)。
- **云端与客户端边界（工程）**：网络与令牌逻辑放在 **`src/app/` 下独立模块**（如 `wallpaperCloud/` 或沿用将扩展的 `storage/repository` 读策略 + 薄 `client`），UI 面板只消费**已解析的模型**；与 **账户/会话**可共用同一后端域时，通过共享 session client 接入，避免在 `SettingsSpotlightModal` 内堆请求。
- **建议交付顺序（可调整）**：① API 契约与错误模型（含未登录态）→ ② 只读列表/应用单张 → ③ 收藏与同步 → ④ 与账户设置/偏好与数据的展示对齐。落地过程中**补一篇**专项笔记（如 `docs/notes/wallpaper-cloud-service-plan.md`）记录端点、缓存键、同步冲突策略，并与本文档互链。
- **与「低」档关系**：上架所需的权限说明、壁纸版权与外链策略，在接真实 CDN/API 时一并补齐。

### 当前结构快照（简）

- **`DesktopGrid` 继续小步拆分**：已抽出 DropZone 与 item mutations；**进一步拆整理态/大块暂缓**，优先保证壁纸/云端主线不被大范围重构牵制。
- **App–设置跨层**：阶段 A/B（类型、`mainLayer`/`overlayLayer`、`openSettingsAt`）已落地；**进一步压缩传参属可选**，见 [`notes/app-settings-desktop-bridge.md`](./notes/app-settings-desktop-bridge.md)。
- **文档与计划易漂移**：壁纸/云端每阶段合入后更新专项笔记与下表「相关文件」。

### 高（结构 / 契约；与产品并行）

1. **交互系统契约**：[`notes/interaction-system-blueprint.md`](./notes/interaction-system-blueprint.md) + [`notes/context-menu-surface-contract.md`](./notes/context-menu-surface-contract.md)；整理态与右击、层级阻断保持一致，并补 E2E 边界回归。
2. **整理模式深化**：[`current-structural-gaps.md`](./current-structural-gaps.md)、[`arrange-mode-technical-plan.md`](./arrange-mode-technical-plan.md)；批量移动、跨页手势与状态机回归。
3. **（可选）App–设置跨层再收口**：仅在出现新的跨层传参痛点时深化；当前以桥接文档与 bundle 为准。
4. **（可选）设置域 UI 原语**：确有重复再抽共享行；保持 test id 与交互语义不变。

### 中（体验与工程质量，跟进推进）

- **主搜索体验**：输入联想、站内图标联想；自定义搜索引擎删除与回退兜底。
- **设置搜索增强**：结果高亮、关键词治理与排序；仍保持一级分区定位（不设二级导航）。
- **多桌面挂载**：`MultiDesktopStrip` 全页挂载 `DesktopGrid` → 访问缓存 + 未访问占位，平衡内存与切换体验。
- **远程资源**：[`favicon-load-optimization-plan.md`](./favicon-load-optimization-plan.md) 策略与双 consumer 已接，**后续**固化 p90 采样与阶段结论。
- **视觉 token**：[`glass-theme-unification-plan.md`](./glass-theme-unification-plan.md)、[`notes/add-icon-theme-refactor-plan.md`](./notes/add-icon-theme-refactor-plan.md) 跨模块一致化。
- **文档一致性**：功能合入时同步计划文与 `docs/notes/docs-todo-audit-2026-04-22.md`。

### 低（多在上架或接真实数据时）

- Manifest `icons`、商店素材；天气等接 API 时的权限与隐私文案。
- **设置 - 账户（业务层）**：在 `SettingsAccountPanel` 之外增加账户域 hook / client；若壁纸收藏/同步与登录态绑定，**与云端壁纸共用会话层**，避免两套 token。
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
| [`notes/app-settings-desktop-bridge.md`](./notes/app-settings-desktop-bridge.md) | App、设置弹层与桌面队列（恢复/添加）数据流与类型约定 |
| [`../src/app/components/SettingsAccountPanel.tsx`](../src/app/components/SettingsAccountPanel.tsx) | 设置 - 账户分区 UI（占位模型；后续接云同步 / 会话） |
| [`notes/context-menu-surface-contract.md`](./notes/context-menu-surface-contract.md) | 右键命中契约：实体优先、最近命中优先、空白兜底与输入语义保留 |
| [`notes/interaction-system-blueprint.md`](./notes/interaction-system-blueprint.md) | 交互系统蓝图：命中层、阻断层、状态层与跨文档约束关系 |
| [`notes/download-wallpaper-context-menu-plan.md`](./notes/download-wallpaper-context-menu-plan.md) | 空白区右键“下载壁纸”：媒体无关下载、回退策略、负向测试与实施步骤 |
| [`notes/wallpaper-dynamic-local-and-cloud-plan.md`](./notes/wallpaper-dynamic-local-and-cloud-plan.md) | 动态壁纸：本地视频/云端媒体类型、IDB 与渲染管线、与现有静态 Data URL 的兼容与分阶段交付 |
| （待建）[`notes/wallpaper-cloud-service-plan.md`](./notes/wallpaper-cloud-service-plan.md) | 云端壁纸 API、鉴权、缓存与同步冲突、与设置「壁纸」分区及页背景的契约（文件落地后与本文档互链） |
| [`minimal-layout-mode.md`](./minimal-layout-mode.md) | 极简布局模式：主区仅搜索、侧栏不变；`layoutMode` 与分层约定 |
| [`notes/navigation-behavior-layer.md`](./notes/navigation-behavior-layer.md) | 外链打开方式：`openExternalUrlImpl`、`useOpenExternalUrl`、存储与整理边界 |
| [`package.json`](../package.json) | `build` / `typecheck` / `lint` / `test:run` |
