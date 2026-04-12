/**
 * 与 App / Sidebar / 网格项 / 文件夹弹层 对齐的 z-index 约定。
 * 说明与扩展原则见 docs/grid-interaction-boundaries-plan.md、docs/project-gaps-and-roadmap.md。
 *
 * Tailwind 侧（示意）：
 * - 背景：无 z 或 z-0
 * - 主内容列：z-10（App.tsx）
 * - 侧栏展开条：z-20；侧栏热区/占位：z-30
 * - 网格卡片：见下方数值（DesktopGridItem 用 inline style）
 * - 卡片内缩放高亮层：z-40～z-50（DesktopGridResizeChrome）
 * - 搜索下拉等：z-50
 * - 网格项右键菜单：z-[60]（GridItemContextMenu，见 Z_GRID_CONTEXT_MENU）
 * - 文件夹全屏弹层：z-[100]（DesktopGridFolderPortal）
 * - 「添加图标」模块弹层：z-[110]（{@link Z_ADD_ICON_DIALOG}），高于文件夹与右键菜单。
 * - 预留全页装饰/宠物：建议在 50～90 或 200+，避免与弹层/侧栏冲突。
 */

/** 默认网格项（未拖拽、非合并目标）。 */
export const Z_GRID_ITEM_BASE = 10;
/** 作为合并目标的悬停格。 */
export const Z_GRID_ITEM_MERGE_TARGET = 20;
/** 正在拖拽的源格。 */
export const Z_GRID_ITEM_DRAGGING = 30;
/** 网格卡片右键菜单（须低于文件夹弹层 z-[100]）。 */
export const Z_GRID_CONTEXT_MENU = 60;
/** 添加图标 / 网址导航模块（须高于文件夹弹层与右键菜单）。 */
export const Z_ADD_ICON_DIALOG = 110;
