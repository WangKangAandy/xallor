# Framer Layout 拉伸问题记录

## 现象

- 文件夹从大形状（如 `4x4`）收缩到小形状（如 `1x2`）时，内部预览图标会短暂被拉伸。

## 根因

- 外层容器使用 Framer `layout` 时，会参与尺寸插值动画。
- 尺寸在过渡中非等比变化，导致子内容出现瞬时形变。

## 处理策略

- 对可缩放卡片容器统一使用 `layout=\"position\"`，仅做位置过渡，避免尺寸插值影响内容比例。
- 内部预览单元保持方形约束（`aspect-ratio: 1 / 1`）。

## 当前代码状态

- 已在 `src/app/components/DesktopGridItem.tsx` 应用 `layout=\"position\"`。
- 已全局检查 `src/app/components`：当前仅该卡片容器使用 Framer layout，已统一到同一策略。

