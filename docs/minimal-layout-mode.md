# 极简布局模式（Minimal Layout）

本文档描述「极简模式」的**产品语义**与**推荐实现形态**，供实现与评审对齐；**不绑定具体排期**。

**阅读顺序**：§1–2 为语义与状态；§3–6 为设计精要；§7 为代码入口表；§8 为实施清单**摘要**；§9 为待定项表；§10 为设计定稿与落地说明；**§11 为已实现行为与测试约定（与当前代码同步）**。

---

## 1. 产品语义

- **极简模式**是用户的**常驻布局偏好**，不是临时「退出某状态」的开关。
- 开启后主内容区**仅保留搜索框**（第一版）；**侧栏与默认模式一致**（交互、层级、从侧栏打开设置等**不因极简而改变**）。**多桌面条、网格**不渲染或等价隐藏。
- **搜索框在视口中的位置与默认模式一致**（由外层布局/容器保证，不因「极简」而整体挪位）。
- 用户通过**通用设置**（与语言等并列）在 `default` / `minimal` 之间切换；实现上为**分段按钮**（`aria-pressed`），避免受控 `<select>` 在自动化与部分环境下与 React 状态不同步。**不单独设计「退出极简」的独立交互**——改回默认布局即可。

### 1.1 与整理模式（网格会话）的关系

- **极简下不存在整理模式**：整理模式依赖主区多桌面与 [`DesktopGrid`](../src/app/components/DesktopGrid.tsx)（含 [`useArrangeSession`](../src/app/components/arrange/useArrangeSession.ts)、手势控制器等）。极简**不挂载** [`MultiDesktopStrip`](../src/app/components/MultiDesktopStrip.tsx)，因此**没有**进入整理、框选、批量操作等入口，**语义上整理模式不适用**。
- **生命周期**：整理会话随条带/网格组件挂载而存在；切到极简后条带卸载，会话**不再存活**（不是「后台挂起」）。切回默认布局、条带重新挂载时，整理会话为**新的初始状态**（与冷打开默认布局一致，通常为未进入整理）。
- **切换布局 = 强制退出整理（契约）**：从 `default` 切到 `minimal` 在语义上等价于 **退出整理会话**（与按 Esc 退出同类：不保留框选/整理态）。详见 §10.2。
- **与 `layoutMode` 正交**：`ui.layoutMode` 描述持久布局偏好；**不要**把 `isArrangeMode` 并进 `layoutMode`。实现边界见 §8.1、§10.2。

### 1.2 与小憩模式的关系

- **正交**：`isResting`（小憩）与 `layoutMode`（极简）分开建模；不在本文档合并。
- **交互**：进入/退出小憩**不改变**用户的 `layoutMode` 持久偏好；极简下仍可进入小憩，行为与默认布局一致（同一 [`useRestModeController`](../src/app/useRestModeController.ts)）。若极简下主区更空、误触小憩增多，可再单独立项优化。

---

## 2. 状态模型（推荐）

- 使用 **`ui.layoutMode`**（或等价命名），类型为 **`"default" | "minimal"`**，作为 **UI Layout State** 的一部分。
- **不建议**用孤立的 `minimalMode: boolean` 表达「主区极简」；后续若增加 `focus`、`dashboard` 等布局，应扩展为**同一枚举/联合类型**，避免多个布尔标志组合爆炸。

---

## 3. 组件与分层（推荐）

- **不要**维护两套完整布局副本（「DefaultLayout / MinimalLayout 各抄一份」）；**应**采用 **单一壳层 + 主列结构化插槽**（`AppShell`：背景 + 侧栏 + 主列容器；主区内用**具名字段**装配子树，而不是隐式数组拼接）。详见 §10.2。
- **主列 slot（显式结构）**：用类型约束「放哪里」，避免后续 `QuickActions` / `RecentSearch` 等靠散落 `if (minimal)` 插缝。首版可只填 `main`（或 `top` + `main`），其余字段留空：  
  - 例：`MainColumnSlots = { top?: ReactNode; main?: ReactNode; bottom?: ReactNode }`（名称可按实现微调）  
  - `default`：`top` = SearchBar，`main` = MultiDesktopStrip（或等价包裹层）  
  - `minimal`：`top` = SearchBar，`main` = 空（未来可在 `bottom` 放轻量扩展）
- **能力边界**：对外暴露 **`getLayoutCapabilities(...)`**（或 `resolveLayoutCapabilities(context)`），组件只读返回的 `LayoutCapabilities`（如 `showDesktop`），**不要**写死「静态对象 + 全局 import」作为唯一形态；首版内部可用查表实现，未来可接入 role / feature flag / agent 输入而不推翻调用方。

---

## 4. 设置入口与持久化

- **入口**：通用设置面板中一项（与语言等并列）。
- **第一版持久化**：`localStorage` + hook；对外以 **`useUiPreferences`** 为**唯一读口**，业务组件**不要**直接读写 `localStorage` 键（与当前 [`AppI18n`](../src/app/i18n/AppI18n.tsx) 单独持 `locale` 并存时，迁移期可接受，但新增 UI 偏好键应走同一出口）。首版只持久化 `layoutMode`；`locale` 仍走 `xallor_locale`，后续迁入同一层（见 §10.1）。  
- **写入时机（已实现）**：`xallor_ui_layout` **仅在用户调用 `setLayoutMode` 时写入**，不在 `useEffect` 中随 `layoutMode` 同步回写，避免与 E2E/迁移脚本等**外部写入**同一键时产生竞态。
- **演进路径（建议写进代码注释/模块头）**  
  - **v1**：`localStorage` + `useUiPreferences` hook（当前）  
  - **v2**：`useUiPreferences` + **React Context**（缓解 prop drilling、多实例）  
  - **v3**：可接 **Zustand / 全局 store**（仍保持同一 hook 或门面 API，避免业务层跟着换库）  
  若未来需要快捷键、URL 参数、多设备同步，优先落在 **v2/v3** 的同一门面之后。

---

## 5. 非目标（第一版可明确不做）

- 不承诺第一版即接入全局状态库（除非团队另有决定）。
- 不单独做与「改回默认布局」重复的「退出极简」按钮/流程。

---

## 6. 与现有持久化文档的关系

- 网格数据等仍遵循 [`persistence-architecture.md`](./persistence-architecture.md) 与 `storage/repository` 约定。
- **纯 UI 布局偏好**可与网格数据解耦存储（本方案用 localStorage + hook 即可），与路线图「扩展原则」中「纯 UI 装饰状态可与网格数据解耦」一致。

---

## 7. 相关代码入口（与仓库同步）

| 区域 | 说明 |
|------|------|
| 应用根布局 | [`src/app/App.tsx`](../src/app/App.tsx)：`getLayoutCapabilities` + `capabilities.showDesktop` 控制是否渲染 `MultiDesktopStrip`；主区桌面容器 `data-testid="desktop-main-slot"`（仅 `default` 时存在） |
| UI 偏好 | [`src/app/preferences/`](../src/app/preferences/)：`layoutTypes.ts`、`layoutCapabilities.ts`、`useUiPreferences.ts`（`UI_LAYOUT_STORAGE_KEY` = `xallor_ui_layout`）、[`index.ts`](../src/app/preferences/index.ts) |
| 搜索条 | [`src/app/components/SearchBar.tsx`](../src/app/components/SearchBar.tsx) |
| 通用设置 / 国际化 | [`SettingsSpotlightModal.tsx`](../src/app/components/SettingsSpotlightModal.tsx)（布局：`data-testid` = `settings-layout-mode-default` / `settings-layout-mode-minimal`，关闭：`settings-modal-close`；遮罩与内容 `z-index` 分层避免误点）、[`AppI18n.tsx`](../src/app/i18n/AppI18n.tsx)、[`messages.ts`](../src/app/i18n/messages.ts)（`settings.layoutMode*` 等） |
| E2E | [`e2e/minimal-layout.spec.ts`](../e2e/minimal-layout.spec.ts)：`addInitScript` 预置 `minimal` 后验证无桌面；极简下通过「默认」按钮恢复桌面 |

---

## 8. 开发实施清单（摘要）

**设计定稿与改造说明以 §10 为准**；**当前仓库已实现内容以 §11 为准**。本节仅保留勾选顺序。

| 顺序 | 内容 | 详见 |
|------|------|------|
| 1 | `useUiPreferences` + `getLayoutCapabilities` + `localStorage` 校验（偏好单入口） | §10.1 |
| 2 | [`App.tsx`](../src/app/App.tsx)：`AppShell` + 主列 slot；`minimal` 不挂载 `MultiDesktopStrip` | §10.1–10.2 |
| 3 | [`SettingsSpotlightModal`](../src/app/components/SettingsSpotlightModal.tsx) + [`messages.ts`](../src/app/i18n/messages.ts) | §10.1 |
| 4 | 单测（`preferences/*.test.ts`）/ E2E（`e2e/minimal-layout.spec.ts`）；整理会话跨布局的显式 E2E 可后续补 | §10.1、§11 |

### 8.1 非目标（本阶段仍不实现）

- 不引入 Zustand；不与 `storage/repository` 网格数据混写。  
- 不把 `isArrangeMode` / `isResting` 合并进 `layoutMode`（见 §10.2）。

---

## 9. 尚未钉死、实现前建议对齐的要点

本节只保留**仍需产品或评审拍板**的项；已在 §10 明确的实现细节不再重复。

| 要点 | 建议默认（可改） |
|------|------------------|
| **主列空白与滚动** | 外层纵向节奏先与默认一致（含 `mb-12`、搜索容器宽度），避免切换时搜索框跳动；若留白过大再单独优化。 |
| **侧栏非设置菜单行为** | 首版维持现状（仅设置有 `onOpenSettings`），其余项先保持 noop，后续有路由再接线。 |
| **小憩与极简交互细节** | 首版沿用同一 [`useRestModeController`](../src/app/useRestModeController.ts)；若误触增多再单独优化阈值/触发条件。 |
| **无障碍增强范围** | 首版从简；若进入合规阶段，再补极简主区描述与可访问性文本。 |

---

## 10. 结合当前代码：实施改造与设计定稿

本节将「如何改当前代码」与「极简模式如何设计」写成可执行版本，优先贴合当前仓库结构。

### 10.1 需要怎么调整当前代码（按文件）

1. **新增 UI 偏好层（统一入口）**  
   - 新增 `src/app/preferences/`（如 `uiPreferences.ts` + hook，命名可微调），定义：  
     - `LayoutMode = "default" | "minimal"`  
     - `UiPreferences`（首版至少含 `layoutMode`；`locale` 可后续迁入）  
     - **`getLayoutCapabilities(layoutMode)`**（或 `resolveLayoutCapabilities(context)`，见 §10.2）：对外**始终是函数**，首版内部可用静态表实现，避免未来 role / flag / agent 接入时推翻调用方。  
   - 新增 **`useUiPreferences`**（或 `useUiLayout`）：统一读写 `localStorage`、非法值回退、并作为**唯一**偏好读口（禁止业务组件散落 `localStorage.getItem('xallor_ui_layout')`）。

2. **重构 `App.tsx` 为 Shell + 显式 Slot**  
   - 保留当前背景层、侧栏层、小憩逻辑（`useRestModeController`）不变。  
   - 主列用**结构化 slot** 装配（见 §3），例如 `top` / `main` / `bottom` 字段，而不是隐式 `[A, B]` 数组拼接。  
   - 首版映射：`default` → `top` = SearchBar、`main` = MultiDesktopStrip；`minimal` → `top` = SearchBar、`main` = 不渲染桌面。  
   - 避免复制两套壳层，防止后续在 JSX 里到处 `if (minimal)` 插组件。

3. **设置面板接入 `layoutMode`**  
   - 在 `src/app/components/SettingsSpotlightModal.tsx` 通用区新增「布局模式」控件。  
   - 通过 props 或轻量 Context 接收 `layoutMode` 与 `setLayoutMode`，不要在 Modal 内直接读写存储。  
   - 更新 `src/app/i18n/messages.ts` 增加中英文文案 key。

4. **明确 arrange 生命周期（代码层）**  
   - 规则：`layoutMode` 从 `default` 切到 `minimal` 时，等价一次 `exitArrangeMode`（语义上强制退出整理）。  
   - 实现上由于 `minimal` 不挂 `MultiDesktopStrip`，`useArrangeSession` 会卸载；仍建议在文档与测试里把该规则写成显式契约，避免误判为 bug。

5. **测试补齐**  
   - 单元：`useUiPreferences` 的默认值、非法值回退、持久化（见 `src/app/preferences/*.test.ts`）。  
   - 集成：`App` 在 `minimal` 下不渲染 `MultiDesktopStrip`，侧栏仍可打开设置（侧栏相关单测中对 `preferences` 做 mock，避免动态 import 超时）。  
   - E2E（已落地）：`e2e/minimal-layout.spec.ts` 使用 `addInitScript` 在首次导航前写入 `minimal`，断言无桌面；在极简下通过设置切回 `default` 并断言桌面恢复。**「default → arrange → minimal → default」全链路整理态不残留**可作为后续专项用例补充。

### 10.2 需要怎么设计极简模式（定稿）

1. **架构形态：一个布局骨架 + 显式 slot 装配**  
   - 不把极简实现为「另一套完整 Layout 副本」。  
   - 采用：`AppShell(背景+侧栏+主列容器)` + **按 `layoutMode` 填充结构化 `MainColumnSlots`**（见 §3），而非隐式数组拼接。

2. **能力模型：解析函数 + capability，不写死为全局静态对象**  
   - 对外 API：**`getLayoutCapabilities(layoutMode): LayoutCapabilities`**（未来可升级为 `resolveLayoutCapabilities({ layoutMode, user, flags, ... })`，参数按需扩展）。  
   - `LayoutCapabilities` 示例字段：`showDesktop`、`allowArrange`（可增删）。首版 `default` → 二者为 `true`；`minimal` → `showDesktop: false`、`allowArrange: false`。  
   - 组件与业务逻辑只依赖 **capabilities 返回值**，不直接 `if (layoutMode === "minimal")` 铺满全站（新模式出现时改解析函数即可）。

3. **状态分层：偏好 / 会话 / 临时态分离**  
   - 偏好：`layoutMode`（持久）。  
   - 会话：`arrangeSession`（仅在桌面条带挂载时存在）。  
   - 临时：`isResting`、`isSettingsOpen`。  
   - 三者保持正交，不合并为一个大枚举。

4. **体验契约（必须明确）**  
   - 极简不影响侧栏。  
   - 极简保持搜索框位置节奏一致。  
   - 切换 `layoutMode` 强制退出整理会话（等价 Esc）。  
   - 切回 `default` 恢复网格数据与当前页（由既有持久化负责），但不恢复已销毁的整理选中态。

---

## 11. 已实现行为与测试约定（与当前代码同步）

以下与 `main` 上实现一致，供评审与回归对照；若代码与本文冲突，以**代码与单测/E2E**为准并回改本节。

| 主题 | 约定 |
|------|------|
| 存储键 | `localStorage` 键 **`xallor_ui_layout`**，值为字面量 **`"minimal"`** 或 **`"default"`**（`setItem` 直接存字符串，见 `useUiPreferences`）；读取时仅当 `getItem === "minimal"` 为极简，否则为 **`default`** |
| 写入时机 | **仅**在用户调用 **`setLayoutMode`** 时写入；**无**「`layoutMode` 变化即 `useEffect` 写回」逻辑，避免与 Playwright `addInitScript`、迁移脚本等外部写同一键竞态 |
| 解析 | 非法或缺失值回退 **`default`**（`parseStoredLayoutMode`） |
| 能力 | `getLayoutCapabilities(layoutMode)`：`minimal` → `showDesktop: false`、`allowArrange: false` |
| `App.tsx` | 依 `capabilities.showDesktop` 决定是否挂载 `MultiDesktopStrip`；主区桌面容器 **`data-testid="desktop-main-slot"`**（仅 `default` 时出现） |
| 设置 UI | 通用设置内「布局模式」为**分段按钮**；`data-testid`：**`settings-layout-mode-default`**、**`settings-layout-mode-minimal`**；关闭：**`settings-modal-close`** |
| E2E | [`e2e/minimal-layout.spec.ts`](../e2e/minimal-layout.spec.ts)：① 预置 `minimal` 后首屏无桌面；② 极简下切回默认并断言桌面恢复（不依赖首屏后再改 storage + reload 的脆弱路径） |
| i18n | [`messages.ts`](../src/app/i18n/messages.ts) 中 `settings.layoutMode`、`settings.layoutModeDesc`、`settings.layoutOptionDefault`、`settings.layoutOptionMinimal` 等 |

