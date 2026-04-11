# 文件夹连续缩放失效记录

## 问题现象

- 部分文件夹在边框拖拽缩放时，只变化一次后失效。
- 同一套交互下，不同文件夹表现不一致。

## 根因

- 旧逻辑在拖拽会话中依赖 `startCols/startRows`（开始时快照）进行约束判断。
- 当文件夹站点数与起始形状组合触发特定分支时，后续连续拖拽会被“锁住”。

## 修复

- 抽离纯函数：`src/app/components/folderResizeRules.ts`
- 使用 `computeResizedShape(...)` 统一处理：
  - 拖拽步进计算
  - 文件夹站点数约束
  - 全局边界约束
- 在 `DesktopGridItem` 中引入会话内实时形状（`lastShapeRef`），确保单次按住拖拽可连续变化。

## 回归测试

- `src/app/components/folderResizeRules.test.ts`
- 覆盖点：
  - 连续拖拽可持续变化
  - `siteCount <= 6` 不进入 `3x3`
  - 形状边界稳定在 `1..4`

