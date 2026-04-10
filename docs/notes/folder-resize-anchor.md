# 文件夹缩放：锚点与位移阈值

- **问题**：`pointerdown` 时若立即设置 `activeResizeDir`，内部预览会从「居中」切换为贴某边，用户仅点击边框未拖拽也会看到图标整体上移/偏移。
- **做法**：位移超过 `RESIZE_DRAG_THRESHOLD_PX`（见 `folderPreviewLayout.ts`）后再设置 `activeResizeDir`；此前保持居中裁切。
- **间距**：多格文件夹使用 `computeFolderContentLayout`，在 `contentPadding` 内对 gap 做自适应并可在必要时略缩小图标，避免大块留白内图标过挤。
- **抽拉渐进**：拖拽时 `computeDrawerContentShape` 综合「拖拽起点、步进预测、`resizePreview` 像素推断」与已提交形状取上界，再按站点数约束；内容层用 `shapeToPixels(该栅格)` 作为布局参考尺寸（图标不随裁切框变小而整体挤压），裁切仍绑 `resizePreview`，实现渐进露出/遮住。
- **竖直锚边**：拖 **上边框** 或 **下边框** 时，预览层均用 `bottom` + `top: auto` 贴底，裁切从上侧进行——下面一行相对磨砂底边不动，上面行随上沿移动或被遮住；若误用 `top` 锚定，收缩 2×2 时会整块贴上沿（像「跳到只剩上 1×2」）。
- **占格推断**：`inferGridShapeFromPixelSize` 须用 **floor** 与 `spanToPixels` 对齐；若用 **ceil**，高度刚过 2 行跨度（如 237px）会误判为 3 行，出现「稍微下拉就满 6 个图标」。`computeDrawerContentShape` 里用 `min(pending, infer)` 防止步进先于像素跳格。
- **定边与扩张/收缩**：不能对上下沿一律底对齐。`computeFolderResizeAnchors` 用「当前 `resizePreview` vs 拖拽起点 `shapeToPixels`」区分扩/缩：**从下沿向下扩** → 竖直 **顶对齐**（新区域在下、图标在上）；**从下沿向上收** → 竖直 **底对齐**。否则 1×2 下拉过程中图标会贴底，松手又跳回顶。
