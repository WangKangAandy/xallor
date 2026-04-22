# Pointer 与层级契约（防回归）

本文档用于约束「整理手势 / 下拉菜单 / 右键菜单 / 弹层」之间的交互边界，减少跨浏览器回归。

## 1) 外部关闭统一规则

- 所有“点外部关闭”场景统一使用：`pointerdown + capture`。
- 不再新增 `mousedown` / `click` 作为外部关闭主监听。
- 推荐复用：`src/app/components/useDismissOnPointerDownOutside.ts`。

原因：

- `pointerdown` 同时覆盖鼠标、触控、触控笔。
- capture 阶段可降低被上层 `preventDefault` 或冒泡链路中断的风险。
- 可避免「A 组件改了手势，B 组件外部关闭失效」的链式回归。

## 2) 全局手势监听约束

- 全局手势（如整理框选）可在必要时调用 `preventDefault`，但必须：
  - 仅在手势激活窗口内生效；
  - 不得依赖 `mousedown` 作为协作组件的唯一触发来源。
- 手势与业务组件交互时，优先通过统一 hook 或显式协议（data-testid / data-attribute）对齐。

### 2.1) 模态叠层与 `document` 捕获整理起手（统一契约）

整理框选在 `document` **capture** 阶段监听 `pointerdown`（见 `useArrangeGestureController`），早于模态内多数子节点。仅依赖 `button/input/...` 排除不够：**模态内普通 div/标题**仍会命中起手逻辑。

**系统规则（必须遵守）**：凡「盖住主桌面、不应让背后手势生效」的叠层，在最外层可命中指针的容器上加 **`data-ui-modal-overlay`**（见 `src/app/components/arrange/uiModalOverlay.ts`）。  
`getArrangeGestureExclusionReason` 与 **`useRestModeController` 双击小憩**均通过 **`isUnderUiModalOverlay`** 识别，**一处标记，两处生效**。

与旧属性的关系：

- **`data-arrange-gesture-exclude`**：仍保留，用于侧栏等**非模态**但需排除整理的区域。
- **`role="dialog"`**：无障碍语义；**不能**单独替代 `data-ui-modal-overlay`（整理排除列表历史上未包含所有 dialog 变体）。

**纵深防御**：需要阻断滚轮/点击落到背后主列时，可在 App 层对主内容包 **`pointer-events-none`**（如设置打开时）；与 `data-ui-modal-overlay` 互补，而非替代。

## 3) Stacking Context 层级约束

- 注意：`transform/translate/opacity/filter` 会创建新的 stacking context。
- 即使子元素 `z-index` 很高，也可能被兄弟 context 整体压住。
- 主页面层级需满足（最小契约）：
  - 搜索容器层 > 网格容器层
  - 文件夹全屏弹层 > 搜索/网格层
  - 添加图标等全局弹层 > 文件夹弹层

已落地示例：

- `App.tsx`：搜索区 `z-20`，网格区 `z-10`。
- `desktopGridLayers.ts`：集中管理核心 z-index 常量。

## 4) E2E 防回归门槛

发布前至少通过以下场景（Chromium + Edge）：

1. `e2e/searchbar-layer.spec.ts`
   - 下拉可见可点选（不被网格遮挡）
   - 点外部可收起
2. `e2e/arrange-gesture.spec.ts` 关键批量路径
   - 同页批量移动
   - 批量并入文件夹
   - 文件夹内多选拖到外层

## 5) 新增交互的接入检查单

- [ ] 外部关闭是否复用 `useDismissOnPointerDownOutside`
- [ ] 是否引入了新的 stacking context；如有，是否声明父层级
- [ ] 是否补充了至少 1 条跨浏览器 E2E
- [ ] 是否与整理手势的 `preventDefault` 路径共存验证
