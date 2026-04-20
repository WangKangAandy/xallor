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

---

## 仍存在的缺口

### 高（结构 / 可扩展——优先做，防后期大重构）

- **整理模式开工前置（新增）**：先对齐当前结构性不足与治理顺序，避免“边做整理模式边返工底层”。前置文档：[`current-structural-gaps.md`](./current-structural-gaps.md)；实施方案：[`arrange-mode-technical-plan.md`](./arrange-mode-technical-plan.md)。
- **网格与交互边界（持续）**：核心拆分与层级约定已落地（`DesktopGridItem` 为薄路由；详见 [`grid-interaction-boundaries-plan.md`](./grid-interaction-boundaries-plan.md)）。后续按需：**可选 layout 上下文**、继续用**纯函数 + 单测**收敛行为，避免把隐式规则写回 JSX。
- **依赖与产物卫生**：已移除未引用 `ui/`；仍建议定期 `depcheck` + 对照 `npm run build`，避免无用依赖回潮。
- **复杂交互回归**：关键路径逐步补测试（Playwright 框架已接入，见 `playwright.config.ts` 与 `e2e/`）；整理模式已覆盖进入、动态增减、阈值不触发、Delete 批删，当前重点转为补齐批量移动（B2-4）与跨页手势 case，避免只靠手工点网格。

### 中（体验与资源——重要，但不等同于「结构高优」；多为面向未来）

- **外链资源（面向未来 / 弱网与扩展环境）**：背景图仍走 Unsplash、favicon 走第三方服务；在弱网或 CSP 收紧时可能不稳定。已用 [`RemoteBackgroundImage`](../src/app/components/feedback/RemoteBackgroundImage.tsx) 对**首页背景**做失败降级；其余可继续：**本地化或渐变兜底**、保持 **Favicon 多源链**；可独立里程碑。
- **缓存与加载加速（新增，专项里程碑）**：详见 [`favicon-load-optimization-plan.md`](./favicon-load-optimization-plan.md)。  
  - 已完成：  
    - 项目级远程资源策略层 `remoteResourcePolicy`（并发竞速、成功源记忆、统一指标、**单候选超时 F3**）  
    - Favicon 作为首个 consumer 接入，并完成量化复测（并发策略较串行显著提升）  
    - `RemoteBackgroundImage` 作为第二个 consumer 接入（`w=` 双分辨率竞速 + 每候选超时 + `background` 成功记忆）  
  - 待完成：  
    - 持续采样与阶段报告（前后对比固化，验证 p90 是否随 F3 下降）
- **隐藏图标空间（新增，产品能力里程碑）**：功能设计与实施顺序见 [`notes/hidden-icons-space-plan.md`](./notes/hidden-icons-space-plan.md)。  
  - 目标：右键隐藏、设置开关+密码、隐藏空间浏览与批量操作、极简模式下“可浏览不可恢复”。  
  - 约束：本期为可用版（本地存储 + 简化密码规则），后续再接云同步与安全增强。
- **设置导航二级化（新增，信息架构里程碑）**：导航草案见 [`notes/settings-secondary-navigation-plan.md`](./notes/settings-secondary-navigation-plan.md)。  
  - 目标：一级分组点击后就地展开二级入口（如外观 -> 主题/壁纸/布局与样式），降低定位成本。  
  - 原则：仅做两层、同一时刻只展开一个一级分组、主区与二级锚点对齐。
- **设置搜索功能（新增，设置可达性里程碑）**：实施方案见 [`notes/settings-search-implementation-plan.md`](./notes/settings-search-implementation-plan.md)。  
  - 目标：支持关键词检索并自动定位到对应设置项，降低“知道要改什么但找不到入口”的成本。  
  - 路线：先交付输入+匹配+定位 MVP，再逐步接入结果高亮与二级导航联动。
- **交互系统蓝图（新增，契约治理里程碑）**：系统蓝图见 [`notes/interaction-system-blueprint.md`](./notes/interaction-system-blueprint.md)，右键命中契约见 [`notes/context-menu-surface-contract.md`](./notes/context-menu-surface-contract.md)。  
  - 目标：统一 pointer/layering、context menu、modal 阻断、输入语义保留等跨组件交互规则。  
  - 路线：先固化契约与回归边界，再逐步收敛到统一交互守卫。
  - TODO（整理态退出统一）：评估并实现“整理态下右击工作区统一退出整理模式”的行为，建议约束为仅作用于整理上下文（桌面/卡片/文件夹层），不覆盖输入区与设置类模态；补 E2E 回归用例锁定边界。
- **空白区右键下载壁纸（新增，体验增强里程碑）**：实现方案见 [`notes/download-wallpaper-context-menu-plan.md`](./notes/download-wallpaper-context-menu-plan.md)。  
  - 目标：在空白区菜单新增“下载壁纸”，支持图片/视频背景下载与失败回退。  
  - 约束：仅影响空白区菜单，不改图标/文件夹菜单；优先下载当前实际背景来源，失败时结构化提示。
- **错误与加载（基线已落地，可随功能扩展）**：展示层提供 [`RemoteContentPlaceholder`](../src/app/components/feedback/RemoteContentPlaceholder.tsx)（加载 / 失败 / 成功）；`storage/repository` 仅数据与校验（见文件头注释），**不**渲染占位组件。未来天气等 API 接入时包一层 `phase` 即可。
- **多桌面网格挂载策略（未做，后续迭代）**：当前 [`MultiDesktopStrip`](../src/app/components/MultiDesktopStrip.tsx) 对每一页都挂载完整 [`DesktopGrid`](../src/app/components/DesktopGrid.tsx)（各含 `DndProvider`）；页数已由 [`MAX_DESKTOP_PAGES`](../src/app/storage/multiPageLimits.ts) 限制。计划在条带层改为 **「访问过则缓存」**：已访问过的页保留实例（隐藏未激活页），未访问页用占位撑布局，在**少重复 mount、保留页内临时状态**与**内存占用**之间折中；**不**采用「仅挂载当前页」以免反复切页时体验过糙。实现时机另排，不阻塞当前主线。
- **毛玻璃视觉统一（持续，工程化）**：已有 [`GlassSurface`](../src/app/components/shared/GlassSurface.tsx) 与右键菜单接入；全站仍有多处手写 `backdrop-blur` / `bg-white/`。**分阶段**把 token 收束到 `theme.css` 变量并迁移高流量组件，见 [`glass-theme-unification-plan.md`](./glass-theme-unification-plan.md)。

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
| [`notes/settings-secondary-navigation-plan.md`](./notes/settings-secondary-navigation-plan.md) | 设置二级导航：一级分组展开、二级入口映射、分阶段落地方案 |
| [`notes/settings-search-implementation-plan.md`](./notes/settings-search-implementation-plan.md) | 设置搜索：索引模型、匹配与定位策略、分阶段交付与测试清单 |
| [`notes/context-menu-surface-contract.md`](./notes/context-menu-surface-contract.md) | 右键命中契约：实体优先、最近命中优先、空白兜底与输入语义保留 |
| [`notes/interaction-system-blueprint.md`](./notes/interaction-system-blueprint.md) | 交互系统蓝图：命中层、阻断层、状态层与跨文档约束关系 |
| [`notes/download-wallpaper-context-menu-plan.md`](./notes/download-wallpaper-context-menu-plan.md) | 空白区右键“下载壁纸”：媒体无关下载、回退策略、负向测试与实施步骤 |
| [`minimal-layout-mode.md`](./minimal-layout-mode.md) | 极简布局模式：主区仅搜索、侧栏不变；`layoutMode` 与分层约定 |
| [`notes/navigation-behavior-layer.md`](./notes/navigation-behavior-layer.md) | 外链打开方式：`openExternalUrlImpl`、`useOpenExternalUrl`、存储与整理边界 |
| [`package.json`](../package.json) | `build` / `typecheck` / `lint` / `test:run` |
