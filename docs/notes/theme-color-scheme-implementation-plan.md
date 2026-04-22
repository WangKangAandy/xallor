# 主题切换实现计划（浅色 / 深色 / 跟随系统）

本文档记录「设置 → 外观 → 主题」从示意控件到**真实切换**的落地计划，并与当前仓库结构对齐。

---

## 1. 现状结论（与计划强相关）

| 点 | 说明 |
|----|------|
| **深色从哪来** | [`src/styles/theme.css`](../../src/styles/theme.css) 中 `@custom-variant dark (&:is(.dark *));`，`.dark { … }` 覆写大量 **CSS 变量**（含 `--glass-*`、网格 token 等）。 |
| **谁在消费这些变量** | [`GlassSurface`](../../src/app/components/shared/GlassSurface.tsx) 等走 `theme.css` 里的 `glass-surface-*`，会随祖先带 `.dark` 而变。 |
| **当前缺口** | 根节点 [`index.html`](../../index.html) 的 `<html>` **未**根据用户选择加/删 `dark`；设置里主题仍为 [`SettingsSpotlightModal`](../../src/app/components/SettingsSpotlightModal.tsx) 内 **本地 `useState`**，未持久化、未驱动 DOM。 |
| **Tailwind `dark:`** | `src` 内几乎**无** `dark:` 工具类；设置弹窗等大量 **`slate-*` / `bg-white/72` 写死**，**仅**在 `<html>` 上加 `.dark` **不会**自动让这些区域变成可读深色，需单独一轮样式（`dark:` 或语义变量）。 |

---

## 2. 目标行为

1. **浅色**：解析为「非深色」→ 根节点 **不含** `dark`（推荐只通过 `classList.toggle("dark", …)` 控制，避免与 `lang` 等其它 class 冲突）。
2. **深色**：根节点 **`class` 含 `dark`**（挂在 `<html>` 最省事，全树命中 `@custom-variant dark (&:is(.dark *))`）。
3. **跟随系统**：持久化值为 **`system`**；**实时**用 `prefers-color-scheme: dark` 决定是否加 `dark`；用户在系统里切换亮/暗时，页面应 **自动**更新。

---

## 3. 实现计划（分阶段）

### 阶段 0：契约与命名

- 定义类型：`ColorSchemePreference = "light" | "dark" | "system"`（或与产品文案统一的 `ThemePreference`）。
- 定义**派生值**：`resolvedScheme: "light" | "dark"`：
  - `preference === "light"` → `"light"`
  - `preference === "dark"` → `"dark"`
  - `preference === "system"` → `matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"`
- 约定：**持久化与用户可见选项** = `preference`；**写 DOM 的唯一依据** = `resolvedScheme`（避免在 `light` 下仍订阅 system 导致逻辑混乱）。

### 阶段 1：持久化 + Context（对齐现有 `UiPreferences`）

**涉及文件**：

- [`src/app/preferences/useUiPreferences.tsx`](../../src/app/preferences/useUiPreferences.tsx)
- [`src/app/preferences/index.ts`](../../src/app/preferences/index.ts)
- [`src/app/preferences/UiPreferencesTestProvider.tsx`](../../src/app/preferences/UiPreferencesTestProvider.tsx)

**任务**：

- 新增 `localStorage` key，例如 `xallor_ui_color_scheme`，取值 `light` | `dark` | `system`，**默认 `system`**。
- 在 `UiPreferencesContextValue` 中增加：
  - `colorScheme: ColorSchemePreference`
  - `setColorScheme: (v: ColorSchemePreference) => void`
- Setter 内同步写 `localStorage`（与现有 `setLayoutMode` / `setOpenLinksInNewTab` 一致），避免 `useEffect` 与外部改写竞态。
- 导出 **`parseStoredColorScheme(raw: string | null)`**（非法值回退 `system`），供单测与首屏脚本对齐。

**单测**：扩展 [`useUiPreferences.test.ts`](../../src/app/preferences/useUiPreferences.test.ts)（读写 storage、非法回退等）。

### 阶段 2：派生明暗 → `<html class="dark">` + **独立 theme runtime（推荐）**

主题属于**全局运行时能力**，不是「只能写在 React 里」的能力。建议抽成独立模块，**DOM 只由一处 apply API 修改**；React 与其它入口只负责**读写 preference / 调用 apply**。

**建议目录**（可微调命名）：

```text
src/app/theme/
  resolveColorScheme.ts    ← 纯函数：preference + prefersDark → resolved
  applyColorScheme.ts      ← documentElement：toggle `dark` + 设置 color-scheme + 见下「幂等 / 事件」
  subscribeSystemScheme.ts ← 仅 system 时注册 matchMedia；离开时 cleanup
  initColorScheme.ts       ← 见下「同步 init + runtime init」拆分
```

**`initColorScheme`：建议拆成「同步算法入口」与「runtime 入口」（降低首屏与 React 漂移）**

| 导出 | 用途 |
|------|------|
| `getInitialResolvedSchemeSync()`（或等价命名） | **纯函数、无 DOM**：读 `localStorage` 原始串 + `matchMedia("(prefers-color-scheme: dark)")`（或传入布尔）→ 返回 `resolved`，供 **单测**、**与内联脚本人工对齐的参照实现**。 |
| `initColorScheme()` | **runtime**：在 `main.tsx` 中于 `createRoot` 前调用 → 内部基于当前 storage 计算 `resolved` 并调用 `applyColorScheme`。 |

**与 `index.html` 内联脚本的关系（重要约束）**：

- 内联脚本 **不能** `import` TypeScript 模块；若不做「构建期注入脚本」，则 **无法在浏览器里直接调用** `getInitialResolvedSchemeSync()`。
- **折中**：内联脚本保留**最小重复实现**，在文件或 `initColorScheme.ts` 顶部用注释写明「**与 `getInitialResolvedSchemeSync` 逐步一致，改一处必须双改**」；或引入 Vite 插件把该函数编译结果注入 `index.html`（成本更高）。
- **长期**：单独 `theme-boot` 入口由构建打成极小的 IIFE，由 `index.html` 引用（单源）。

**`applyColorScheme` 必做两项（`color-scheme` 不作为可选）**：

1. `document.documentElement.classList.toggle("dark", resolved === "dark")`
2. `document.documentElement.style.colorScheme = resolved`（`"light"` | `"dark"`）  

否则易出现滚动条、原生 `input`/`select` 与页面主题割裂。

**`applyColorScheme`：幂等保护（建议）**：

- 在内存中保留「上次已应用的 `resolved`」（或比较 `classList` / `style.colorScheme`），若 **`next === current`** 则 **跳过 DOM 写**，减少无意义 repaint；若后续加切换动画，也更安全。

**主题变更事件 `xallor:theme-change`（建议预埋 + 写死触发条件）**：

- **必须**：仅在 **`resolved` 与「上次已成功 apply 的 resolved」比较后确实发生变化** 时，才 `window.dispatchEvent(new CustomEvent("xallor:theme-change", { detail: { resolved } }))`。  
- **禁止**：在 **幂等分支**（`next === current`、早退不写字段 / 不写 `classList`）内派发事件。  
- **原因（避免未来隐形坑）**：若重复 `apply`、或调用方 override 后 `resolved` 未变仍派发，监听方会 **重复刷新壁纸、重复触发副作用渲染**，难以排查。  
- 供后续：壁纸联动、图标反色、非 React 模块刷新等 `window.addEventListener("xallor:theme-change", …)`，无需当下实现消费者。

**`matchMedia`：严格 gating + cleanup（状态机，不是裸 `useEffect`）**：

- **仅当** `preference === "system"` 时注册 `prefers-color-scheme` 的 `change` 监听。
- 用户从 **`system` → `light` / `dark`** 时，必须 **立即 `removeEventListener`（或等价 dispose）**，否则监听仍会触发并**覆盖用户显式选择**。

**`subscribeSystemScheme`：单实例约束（建议写进实现）**：

- **全局任意时刻至多存在一个** `prefers-color-scheme` 的 `change` 监听实例（由 theme runtime 持有）。  
- **禁止**：在多个 `useEffect` / 多个 Provider 副本中各自 `addEventListener` 而不协调。  
- **推荐**：模块级单例（`let unsubscribe: (() => void) | null`）或 `subscribe()` 再次调用时先 **dispose 旧监听** 再注册新监听，与 React Strict Mode 双调用兼容时尤需注意。

**挂载点（多入口一致）**：

1. **[`index.html`](../../index.html)**：首屏**极短内联脚本**；算法与 **`getInitialResolvedSchemeSync` 文档对齐**（见上节「与内联脚本的关系」）。
2. **[`src/main.tsx`](../../src/main.tsx)**：在 `createRoot` **之前**调用 `initColorScheme()`（内部使用与同步函数同一套 resolve + `applyColorScheme`）。
3. **`UiPreferencesProvider`**：`setColorScheme` 与 `preference` 初始同步后，调用同一 `applyColorScheme(resolved)`；`system` 模式下挂载 `subscribe`，cleanup 同上。

**注意**：`UiPreferencesProvider` 须包住整棵应用（当前在 [`App.tsx`](../../src/app/App.tsx) 已包裹）。Provider 内可用 `useLayoutEffect` **调用** `applyColorScheme`，而不是把算法散落在组件里。

### 阶段 3：设置 UI 接线

**文件**：[`src/app/components/SettingsSpotlightModal.tsx`](../../src/app/components/SettingsSpotlightModal.tsx)

- 移除 `SettingsAppearancePanel` 内主题的 **`useState`**。
- 使用 `useUiPreferences()` 的 `colorScheme` / `setColorScheme` 绑定现有 `SegmentedControl`。

### 阶段 4：深色下的观感补齐（分期，可与功能分 PR）

**现状**：加 `dark` 后，毛玻璃 / 网格等会跟 `theme.css` 变量走；**设置弹窗**等硬编码 **`slate-*` / `bg-white/72`** **不会**自动变好。

**三层模型（长期工程化，避免「每个组件堆 `dark:`」）**：

| 层 | 内容 | 本仓库 |
|----|------|--------|
| **层 1：基础变量** | `:root` / `.dark` 下 token | 已有 [`theme.css`](../../src/styles/theme.css)，保持为单一真源 |
| **层 2：组件语义** | 如 `--panel-bg`、`--text-primary` 等，供壳层复用 | **缺口**：可逐步在 `theme.css` 或局部 scope 增加，替代业务里裸 `slate-*` |
| **层 3：具体组件** | `bg-[var(--panel-bg)]` 或少量 `dark:` 补丁 | 新 UI 优先语义变量；**补丁级 `dark:`** 仅作过渡期 |

**分期建议（节奏再收紧：先产品验证，再沉淀变量体系）**：

- **4a（第一版上线）**：**只做** **`SettingsSpotlightModal`** + **主界面核心面板 / 壳**（如侧栏、搜索条、桌面区外层等「用户一眼看到」的块），用 **`dark:`** 或**极少**局部语义变量保证深色可读。**不**在第一版扩张 `theme.css` 的全局语义层（不把「层 2 变量体系」当作本版必交付物）。
- **理由**：当前短板是「深色下可读与一致」，不是「缺少变量命名表」；应先验证产品路径，再在 **4b** 中有意识地沉淀 `--panel-bg` 等 token，避免反过来用大重构阻塞主题开关上线。
- **4b（第二期）**：按模块把高频面板迁到**语义变量**，约定「新代码不在壳层写裸 `slate`」，减少改一次主题改几十个文件的风险。

**体验加分（可选）**：主题切换时避免毛玻璃「硬切」——可对 `html` / `#root` 使用短 **`transition`**（仅 `background-color` / `color` 等少量属性），或短暂加 `html.theme-transitioning` class；注意性能，勿 `transition: all`。

### 阶段 5：测试与回归

| 类型 | 内容 |
|------|------|
| **单元** | `parseStoredColorScheme`；`getResolvedScheme` / `getInitialResolvedSchemeSync`；可选 mock `document.documentElement.classList` 测 apply **幂等**；可选断言 `CustomEvent` 仅在 resolved 变化时派发。 |
| **手动** | 三档切换；系统深浅切换时「跟随系统」是否变；刷新后是否保持。 |
| **E2E（可选）** | Playwright `emulateMedia({ colorScheme: 'dark' })` + 断言 `html` 是否含 `class` `dark`。 |

---

## 4. 风险与决策点

1. **`UiPreferences` vs 独立 `ThemeProvider`**：与 `layoutMode` 同属全 UI 偏好，放同一 Provider 改动面小；主题逻辑膨胀后再拆亦可。
2. **SSR**：当前 Vite SPA 无 SSR；若未来引入 SSR，首屏脚本与 hydrate 需对齐。
3. **扩展环境**：若将来作为 Chrome 新标签页等，需确认 `localStorage` / `matchMedia` 行为与预期一致。

---

## 5. 建议任务顺序（Checklist）

1. `ColorSchemePreference` + storage + `parse*` + `UiPreferences` 字段与 setter + 单测  
2. `src/app/theme/`：`resolve` + `apply`（**含 `color-scheme`、幂等、仅 resolved 变化时 `xallor:theme-change`**）+ `subscribe`（**gating + cleanup + 单实例**）+ `getInitialResolvedSchemeSync` + `initColorScheme`  
3. `main.tsx` 在 `createRoot` 前调用 `initColorScheme`；（推荐）`index.html` 内联脚本与 `getInitialResolvedSchemeSync` **双源对齐或构建单源**  
4. `UiPreferencesProvider` 内仅**调用** `apply` / `subscribe`，不写散落的 DOM 逻辑  
5. `SettingsAppearancePanel` 绑定 `useUiPreferences`  
6. **4a**：设置弹窗深色可读（`dark:` 或局部语义变量）；**4b（后续）**：语义变量推广  
7. （可选）主题切换短过渡  
8. 在 [`AGENTS.md`](../../AGENTS.md) 或本 `docs/notes` 中保持一句：**主题 = `applyColorScheme`（`html.dark` + `color-scheme`）+ `prefers-color-scheme`（仅 system 监听）**  

---

## 6. 相关文件索引

| 路径 | 作用 |
|------|------|
| [`src/styles/theme.css`](../../src/styles/theme.css) | `.dark` 与 CSS 变量 |
| [`src/app/preferences/useUiPreferences.tsx`](../../src/app/preferences/useUiPreferences.tsx) | 偏好 Context，拟扩展 `colorScheme` |
| [`src/app/components/SettingsSpotlightModal.tsx`](../../src/app/components/SettingsSpotlightModal.tsx) | 外观主题控件接线处 |
| [`index.html`](../../index.html) | 可选：首屏防闪内联脚本 |
| [`src/main.tsx`](../../src/main.tsx) | 入口：`createRoot` 前 `init` |
| `src/app/theme/*.ts`（拟） | resolve / apply / subscribe / init |

---

## 7. 评审合并说明（对外部反馈的取舍）

下列结论已反映到上文阶段 2、阶段 4 与 Checklist。

| 反馈要点 | 结论 |
|----------|------|
| **`html.dark` 唯一开关** | 维持；不与 `data-theme` 混用。 |
| **`preference` ≠ `resolved`** | 维持；写 DOM 只依据 `resolved`。 |
| **首屏 inline script** | 维持；产品级防 FOUC。 |
| **主题 = 全局 runtime，非「只能 React」** | 采纳：**独立 `src/app/theme/` + `apply` 单点**；`index.html` / `main.tsx` / Provider **均为调用方**。不教条要求「React 绝不能碰 DOM」——而是 **只允许通过 `applyColorScheme` 碰**。 |
| **`matchMedia` 必须 gating + cleanup** | 采纳；`system → light/dark` 时必须卸载监听。 |
| **`color-scheme`** | 从「可选」升级为 **apply 内必做**。 |
| **视觉：变量为主、`dark:` 为补丁** | 采纳 **4a / 4b 分期**，避免一次性改全仓。 |
| **切换过渡动画** | **可选加分项**，注意勿 `transition-all`。 |
| **`xallor:theme-change` 触发契约** | **写死**：仅当 `resolved` **相对上次已 apply 的值**发生变化时派发；**不得在幂等早退分支派发**，避免壁纸/组件重复刷新。 |
| **`subscribeSystemScheme` 单实例** | **写死**：全局至多一个 system 的 `matchMedia` 监听；再次 `subscribe` 须先 dispose 旧实例，避免多监听与泄漏。 |

**一句话目标（与评审对齐）**：

```text
localStorage 存 preference（light / dark / system）
→ 独立 theme runtime：resolve +（仅 system 时）matchMedia + apply（html.dark + color-scheme）
→ React 与各入口只设置 preference 并调用 apply
→ UI 颜色长期走语义变量；短期允许设置壳层用 dark: 补丁
```

---

## 8. 合理性说明（对上述「3 点补充 + 阶段 4 判断」）

| 建议 | 是否合理 | 说明 |
|------|----------|------|
| **同步 init + runtime init 拆分** | ✅ 合理 | 降低「改 TS 忘改内联」风险；受 SPA 限制，真·单源往往要 **构建注入** 或 **极小重复 + 校验注释**，文档已写明。 |
| **apply 幂等** | ✅ 合理 | 成本低，利于性能与后续动画。 |
| **`xallor:theme-change`** | ✅ 合理 | 命名空间事件避免污染通用名；**必须在文档与代码中写死**：仅 **resolved 相对上次已 apply 发生变化** 时派发，**幂等分支禁止派发**。 |
| **`subscribeSystemScheme` 单实例** | ✅ 合理 | 避免多处 `addEventListener`、Strict Mode 双挂载导致重复回调；实现上模块单例或「先 dispose 再注册」。 |
| **第一版只做 Settings + 核心面板、不扩全局变量** | ✅ 合理 | 与「先验证产品、再沉淀变量」一致，且与本文 **4a / 4b** 已对齐，仅把节奏写得更明确。 |

---

*文档版本：已合并主题计划、评审收紧项、§8 补充及「theme-change 契约 / system 监听单实例」约束；随实现进度可更新 checklist 勾选状态。*
