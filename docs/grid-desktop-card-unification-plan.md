# 桌面网格卡片表面层统一 — 落地计划

## 目标

将「站点 / 文件夹大卡 / 天气」三套表面收敛为两套 **语义档**：

| 档 | 用途 | 实现 |
|----|------|------|
| **gridTile** | 单站点图标格 | `GlassSurface` variant `gridTile` + `--grid-tile-*` |
| **gridPanel** | 文件夹外壳、天气等大卡 | `GlassSurface` variant `gridPanel` + `--grid-panel-*` |

文件夹内 **预览小格** 继续用 `--glass-folder-preview-*`（或后续改名为 `--grid-folder-preview-*`），不与外壳混写。

## 交付物（本次 PR）

1. **`theme.css`**：新增 `--grid-tile-radius`、`--grid-panel-radius`、`--grid-tile-*` / `--grid-panel-*`（bg/border/shadow/blur）、`--grid-label-offset-y`；新增 `.glass-surface-grid-tile` / `.glass-surface-grid-panel`。
2. **`GlassSurface`**：注册 variant `gridTile`、`gridPanel`。
3. **`GridDesktopCardSurface`**：`variant="tile" | "panel"`，`isMergeTarget` 统一 merge 高亮；子节点即内容。
4. **迁移**：`DesktopGridItemSiteBody`、`DesktopGridItemFolderBody`（外壳）、`DesktopGridItemWidgetBody` + `WeatherCard`（单层壳、去掉重复包层）。
5. **`GridItemLabel`**：`placement="bottom" | "inside"`，`editable`；站点/文件夹底部标题迁入，去掉重复内联 style。
6. **回归**：`npm run build`、`npm run test:run`。

## 非目标（后续）

- 日历/待办具体内容。
- dark 下 grid token 独立调参（可先继承 `:root`）。

## 状态（已落地）

- `theme.css`：`--grid-*` token + `.glass-surface-grid-tile` / `.glass-surface-grid-panel`；合并高亮 `--grid-merge-*`（`.dark` 内可覆盖）。
- `GlassSurface`：`gridTile` / `gridPanel` variant。
- `GridDesktopCardSurface.tsx`、`GridItemLabel.tsx`。
- 站点 / 文件夹大卡 / 天气外壳已迁入；天气内容区仍为内容型布局，标题未强制 `GridItemLabel`。

## 风险与回滚

- 视觉微差：以 token 对齐原文件夹 `rgba(255,255,255,0.35)` + `blur(16px)`。若需像素级还原，只改 `--grid-panel-*`。
- 回滚：恢复三处 Body 与 `WeatherCard` 的旧写法，删掉新组件与 CSS 类。
