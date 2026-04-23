# App、设置弹层与桌面队列桥接

本文档说明「从 App 打开设置」到「在桌面网格上生效」的数据流，便于后续扩展分区或云同步时不重复造第三条通路。

## 分层职责

| 层 | 职责 |
|----|------|
| `useSettingsModalController` | 是否打开、**初始分区**（`SettingsSectionId \| undefined`）；**统一入口** `openSettingsAt(section?)`，其余 `openSettings*` 均为薄封装 |
| `useSettingsDesktopIntegration` + `useSettingsSpotlightBindings` | 把隐藏空间、布局偏好等**装配**为 `settingsState` / `settingsActions`；维护 `restoreItems`、`pendingAddPayloads` 两条队列 |
| `useAppContentController` | 返回 **`mainLayer`**（主区 + 侧栏 + 桌面队列）与 **`overlayLayer`**（设置弹层 + 全局消息 + 背景菜单 Portal），`App.tsx` 各展开一层，减少跨壳层零散 props |
| `AppOverlayLayer` | 将 `settingsState` + `settingsActions` 展开给 `SettingsSpotlightModal` |
| `AppMainLayer` → `MultiDesktopStrip` | 消费 `pendingAddPayloads`（站点添加）、`restoreItems`（从隐私空间恢复）；完成后回调 `onAddPayloadsConsumed` / `onRestoreApplied` |

## 阶段 B 选型（壳层打包 vs 单独 facade hook）

- **按壳层打包 `mainLayer` / `overlayLayer`**：直接减少 `App.tsx` 的 props 面与解构长度，类型上 `AppMainLayerBundle` / `AppOverlayLayerBundle` 与各自组件一一对应，**收益立竿见影、无额外 hook 文件**。
- **单独 `useSettingsNavigation` hook**：在仅 `AppContent` 一处消费打开入口的场景下，**边际收益小**，还会多一层间接跳转；打开设置的**统一函数**已收敛在 `openSettingsAt`，内部接线（如背景菜单）用稳定 `useCallback` 包装即可。

结论：当前采用 **壳层对象 + `openSettingsAt`**；若未来多处深链（侧栏外、扩展消息等）都要打开设置，再抽 `useSettingsOpenActions` 不迟。

## 初始分区类型

App 层 **`AppSettingsInitialSection`** 已与 **`SettingsSectionId`** 对齐（见 `useSettingsModalController.ts`）。`undefined` 表示打开后由 `useSettingsSectionRouting` 默认落到 **general**。

新增「从外部打开某分区」时：在 `useSettingsModalController` 增加薄封装 `openSettingsXxx(() => openSettings("…"))` 即可，避免与设置内 `SECTIONS` 再维护一套互斥字面量。

## 隐私空间绑定类型

`HiddenSpaceSettingsBinding` 定义在 `src/app/hiddenSpace/hiddenSpaceSettingsBinding.ts`，供设置绑定与桌面集成共用，与 `useHiddenSpace()` 返回结构兼容（可多字段，不可少字段）。

## 相关代码入口

- `src/app/useAppContentController.ts`：总装配
- `src/app/useSettingsDesktopIntegration.ts`：队列 + Spotlight 绑定
- `src/app/useSettingsSpotlightBindings.ts`：`settingsState` / `settingsActions`
- [`project-gaps-and-roadmap.md`](../project-gaps-and-roadmap.md)：当前优先级总览
