# 毛玻璃样式主题统一计划

本文档说明**为何**要做统一、**唯一真相**放在哪里、以及建议的**分阶段落地**，避免与 [`grid-interaction-boundaries-plan.md`](./grid-interaction-boundaries-plan.md) 中的交互边界混淆：此处只管**视觉 token 与容器组件**，不改变 DnD / 状态流。

## 现状

- **已存在单一入口组件**：[`src/app/components/shared/GlassSurface.tsx`](../src/app/components/shared/GlassSurface.tsx)（`forwardRef`，浅色：`backdrop-blur-xl` + 半透明白底 + 描边 + 阴影）。
- **仍大量散落**：`SearchBar` 引擎下拉、`DesktopGridFolderPortal` 主面板、`WeatherCard`、`Sidebar`、`DesktopGridItemSiteBody` 内联样式等各自拼 Tailwind，**数值略有差异**（如 `bg-white/40` vs `bg-white/70`、`backdrop-blur-md` vs `backdrop-blur-3xl`）。
- **风险**：改版毛玻璃（透明度、模糊强度、暗色模式）时要改多处，易漏、易不一致。

## 目标

1. **一处改、全局跟**：毛玻璃的「底色透明度、模糊档位、边框、阴影」有明确定义。
2. **组件优先、变量兜底**：React 里优先用 `GlassSurface`（或薄封装）；纯 CSS / 无法用组件时再用 **CSS 变量** 对齐同一套 token。
3. **渐进迁移**：新代码禁止复制长串玻璃 class；旧代码按优先级分批替换，不要求单次 PR 改全站。

## 建议的「唯一真相」分层

| 层级 | 内容 | 说明 |
|------|------|------|
| **Token（设计变量）** | 在 `src/styles/theme.css`（或 Tailwind `@theme`）定义 `--glass-bg`、`--glass-blur`、`--glass-border`、`--glass-shadow` 等 | 换主题 / 暗色时只改编量；Tailwind 可用 `bg-[color:var(--glass-bg)]` 等引用。 |
| **组件（实现）** | `GlassSurface` 读取上述变量 **或** 暂时仍用固定 class，但**集中**在 `GlassSurface` 一处 | 已用菜单、后续弹层、卡片外壳统一包一层。 |
| **变体（可选）** | `GlassSurface` 增加 `variant?: "panel" \| "menu" \| "dense"` | 对应大面板（文件夹）、菜单、小 chip；内部映射到不同 token 或 class 组合。 |

**原则**：避免同时维护「变量文件 + GlassSurface 内写死两套值」——迁移期可二选一为主，迁移完成后以变量 + 组件为准。

## 进度（维护时更新）

| 阶段 | 状态 | 说明 |
|------|------|------|
| B token + `GlassSurface` 变体 | **已落地** | `:root` 与 `@layer components` 中 `.glass-surface-*`、`.glass-scrim`；`GlassSurface` 支持 `variant` / `rounded`（含 `none`、`full`）。 |
| C 高流量迁移 | **已落地** | 含：`MultiDesktopStrip` 指示条、`RemoteContentPlaceholder`、`App` Suspense 骨架与全页渐变 veil、`DesktopGridItemWidgetBody` 懒加载骨架、`SearchBar` 添加引擎表单（输入/按钮 token）、`FaviconIcon` 占位、`folderPreview` 预览格；此前已接：`GridItemContextMenu`、`DesktopGridFolderPortal`、`SearchBar` 主行与下拉、`DesktopGridItemSiteBody`、`Sidebar`、`WeatherCard`。 |
| D 暗色 | 未做 | 见上文。 |

## 分阶段执行（建议顺序）

### 阶段 A：盘点（半日～1 日）

- 列出所有含 `backdrop-blur` / `bg-white/` 玻璃语义的组件路径（可用仓库内 `rg "backdrop-blur"`）。
- 按**用户可见优先级**排序：文件夹弹层 → 搜索栏/下拉 → 网格站点/文件夹 tile → 侧栏 → 天气卡等。

### 阶段 B：落 token（1 PR）

- 在 `theme.css`（或项目现有主题入口）增加 `--glass-*` 变量，默认值与当前 `GlassSurface` 视觉**尽量一致**，减少一次性视觉跳变。
- 将 `GlassSurface` 的 `base` class 改为引用这些变量（若 Tailwind 不便，可用 `style` 或一层 `class` 在 `index.css` 用 `@apply` 极少量封装）。

### 阶段 C：迁移高流量组件（多 PR，可并行）

1. **`DesktopGridFolderPortal`**：外层遮罩 + 内层白卡片改为 `GlassSurface` 或 token + 结构不变。
2. **`SearchBar`**：引擎下拉面与主输入条外壳对齐 `GlassSurface` / variant。
3. **`DesktopGridItemSiteBody` / 文件夹预览 tile**：内联 `backdropFilter` 逐步换为组件或 `var(--glass-*)`。
4. **`Sidebar` / `WeatherCard`**：同上。

每 PR 可附带**截图或 Storybook**（若后续引入）对比前后，避免无意改设计。

### 阶段 D：暗色 / 高对比（可选，独立里程碑）

- 若产品需要暗色新标签页：扩展 `--glass-*` 为 `[data-theme=dark]` 下另一套值，`GlassSurface` 根据 `document` 或 context 切换，**不**在业务组件里写死两套 class。

## 与 z-index 的关系

毛玻璃层仍须遵守 [`desktopGridLayers.ts`](../src/app/components/desktopGridLayers.ts) 与 [`grid-interaction-boundaries-plan.md`](./grid-interaction-boundaries-plan.md)：统一玻璃**不**改变弹层与网格的叠放顺序；仅替换「同一层里的填充样式」。

## 验收标准（阶段 B+C 完成后）

- 新增浮层/菜单默认使用 `GlassSurface`（或文档明确例外）。
- `rg "backdrop-blur"` 在业务组件中的命中数**持续下降**（允许装饰/第三方例外）。
- 调整 `--glass-bg` 等变量时，已迁移区域**无需逐文件改 class**。

## 相关文件

| 文件 | 作用 |
|------|------|
| [`../src/app/components/shared/GlassSurface.tsx`](../src/app/components/shared/GlassSurface.tsx) | 当前统一容器实现 |
| [`../src/app/components/GridItemContextMenu.tsx`](../src/app/components/GridItemContextMenu.tsx) | 右键菜单（已用 GlassSurface） |
| [`../src/styles/theme.css`](../src/styles/theme.css) | 建议挂载 `--glass-*` 的位置（以仓库实际为准） |
