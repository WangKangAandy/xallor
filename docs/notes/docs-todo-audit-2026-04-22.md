# Docs 与 TODO 整理汇总（2026-04-22）

本文档用于同步 `docs/` 当前状态，减少“文档写未完成、代码已完成”的认知偏差。

## 1. 已完成并已从主缺口移除

- 隐藏图标空间（v1）
  - 文档：`docs/notes/hidden-icons-space-plan.md`
  - 代码：`src/app/hiddenSpace/useHiddenSpace.ts`、`src/app/components/SettingsSpotlightModal.tsx`
- 空白区右键下载壁纸（v1）
  - 文档：`docs/notes/download-wallpaper-context-menu-plan.md`
  - 代码：`src/app/components/feedback/downloadWallpaper.ts`、`src/app/components/useGridBackgroundContextMenu.tsx`
- 默认搜索引擎设置（v1）
  - 文档：`docs/notes/default-search-engine-preference-plan.md`
  - 代码：`src/app/preferences/useUiPreferences.tsx`、`src/app/components/SearchBar.tsx`、`src/app/components/SettingsSpotlightModal.tsx`

## 2. 当前仅保留的未落地 TODO

- 交互系统统一（整理态右击退出等边界，未收口）
  - 文档：`docs/notes/interaction-system-blueprint.md`、`docs/notes/context-menu-surface-contract.md`
- AddIcon 主题治理尾项（未完成）
  - 文档：`docs/notes/add-icon-theme-refactor-plan.md` 第 11 节
- App 编排层解耦后续（持续进行中）
  - 文档：`docs/project-gaps-and-roadmap.md`（P1：App 编排层解耦）

> 说明：设置搜索 MVP 已落地（`settingsSearch.ts` + `useSettingsSectionRouting.ts`），相关文档保留为“增强清单”，不再作为“未落地 TODO”；设置导航二级化需求已下线，不再跟进。

## 3. 本次已做的文档清理

- `docs/project-gaps-and-roadmap.md`
  - 将“隐藏图标空间”“空白区右键下载壁纸”从“仍存在的缺口”移除，迁入“归档指针（已完成）”。
  - 同步 P1 App 解耦进度与测试稳定性治理结论（`App.sidebar-layer.test.tsx` 噪声归因为测试 harness，非业务回归）。
- `docs/notes/download-wallpaper-context-menu-plan.md`
  - 增加“实现状态（2026-04-22）”，将测试段改为“现状与增量”，避免继续以“必须待完成”表述已交付能力。
- `docs/notes/default-search-engine-preference-plan.md`
  - 增加“实现状态（2026-04-22）”，标注 v1 已落地，仅保留后续增强说明。

## 4. 建议的后续整理动作

- 给下列文档加页首状态标签（`进行中` / `已落地` / `历史记录`）：
  - `docs/notes/navigation-behavior-layer.md`
  - `docs/notes/motion-layout-distortion.md`
  - `docs/notes/folder-resize-continuous-drag.md`
- 若团队同意，可新增 `docs/archive/`，把“已关闭问题单文档”迁入归档，主 `notes/` 只保留活跃计划与契约文档。

