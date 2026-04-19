# 导航行为层（Navigation Behavior Layer）

本文档钉死**外链 / 快捷方式**打开方式的**存储、API 分层与责任边界**，避免实现阶段各写一套。只约束**怎么做**，不重复讨论是否做。

**总则**：独立 key、`openExternalUrlImpl` 纯函数 + `useOpenExternalUrl` 注入偏好、整理模式在**调用组件**拦截（导航层不感知 arrange）。

---

## 1. 目标

- 用户可在**通用设置**选择：每次**新标签页**打开（默认）或**当前标签页**打开。
- 所有「打开外部 URL」的行为经**统一入口**处理；业务组件**不得**直接调用 `window.open` / `location.assign`（单测与极少数底层适配除外）。

---

## 2. 存储策略（已定死）

- **首版采用独立 `localStorage` key**，与 `xallor_ui_layout`、`xallor_locale` 的 **key-per-preference** 模型一致。
- **不**引入 `UiPreferences` JSON 整包；**不**做 layout 键迁移。
- 建议键名：**`xallor_ui_open_links_in_new_tab`**
- **取值（首版钉死，解析见下表）**：
  - **`"1"`** → `openLinksInNewTab === true`（新标签，**默认**）
  - **`"0"`** → `openLinksInNewTab === false`（当前标签）
  - **任何其它**（`null`、空串、`"true"`、未知串等）→ 视为 **`true`**（与默认产品行为一致，避免脏数据锁死异常态）

- **写入时机**：仅在用户通过设置调用 **`setOpenLinksInNewTab`**（或等价 setter）时写入；**禁止** `useEffect` 随状态同步回写（与 `layoutMode` 策略一致，避免 E2E 与外部脚本竞态）。

- **演进（非必须）**：若未来出现第三种打开方式（如仅后台打开），可将取值升级为 **`"new-tab"` | `"same-tab"` | …** 并做读兼容；首版不预置，避免过度设计。

---

## 3. API 分层（已定死）

### 3.1 Layer 1 — `openExternalUrlImpl`（纯函数、无状态、可单测）

职责：**只**根据参数决定如何打开 URL，**不**读 React、**不**读 `storage`。

```ts
export type OpenExternalUrlOptions = {
  /** true = 新标签；false = 当前标签 */
  openInNewTab: boolean;
};

/**
 * 底层唯一实现：分支 window.open vs location.assign。
 * - 新标签：须等价于安全的新开标签行为（如 `window.open(url, "_blank", "noopener,noreferrer")` 或等价写法），与 `<a target="_blank" rel="noopener noreferrer">` 对齐。
 * - 当前标签：使用 **`location.assign(url)`**（规范统一用 `assign`，避免与 `href` 混用）；**不涉及** noopener（同页导航无跨窗口问题）。
 */
export function openExternalUrlImpl(url: string, options: OpenExternalUrlOptions): void;
```

单测：mock `window.open`、`location.assign`，断言两种分支。

**用户手势与弹窗拦截（必须遵守）**：`window.open` 须在**用户手势的同步调用链**内执行（例如 `click` / `auxclick` 处理函数内直接调用）。**禁止**在无故 `setTimeout(0)` / 未与用户手势绑定的异步回调里再 `open`，否则易被浏览器判定为弹窗而拦截。

---

### 3.2 Layer 2 — `useOpenExternalUrl`（业务唯一入口）

职责：从 **`useUiPreferences`** 读取 `openLinksInNewTab`，计算**最终**是否新标签，再调用 `openExternalUrlImpl`。

建议签名（与实现一致）：

```ts
import type { KeyboardEvent, MouseEvent } from "react";

export type OpenExternalUrlModifierEvent = MouseEvent | KeyboardEvent | undefined;

/** 返回的函数应用 useCallback 稳定引用。 */
export function useOpenExternalUrl(): (url: string, event?: OpenExternalUrlModifierEvent) => void;
```

**修饰键与鼠标键（首版即实现）**：在**用户显式**用系统默认方式「新开标签」时，应**强制新标签**，**覆盖**用户设置中的「当前标签」：

- 主键点击时：**`event.metaKey || event.ctrlKey`**（macOS Cmd / Windows Ctrl）→ 视为 `openInNewTab: true`。
- **中键**：主键的 `click` 通常**不包含**中键；中键需在 **`onAuxClick`**（或等价）里处理，**`event.button === 1`** 时 → 强制新标签。实现处须注释说明与 `click` 的分工。

**不要求**（保持浏览器默认即可）：右键菜单「在新标签页中打开链接」、拖拽、地址栏行为等由浏览器处理，本层不拦截。

**使用约束（必须遵守）**：业务组件**只能**通过 `useOpenExternalUrl()` 返回的函数打开外链；**禁止**在组件内直接 `window.open` / `location.assign`。

---

### 3.3 `<a>` 与「双跳转」防范（必须写死）

若用 `<a href={url}>` 再叠加脚本打开：

- 必须在 **`onClick`（及需要时的 `onAuxClick`）中 `event.preventDefault()`**，再调用 `openUrl(url, event)`，否则会出现 **默认导航（当前页） + 脚本逻辑** 的 **双跳转**。

推荐形态：

```tsx
<a
  href={url}
  onClick={(e) => {
    e.preventDefault();
    openUrl(url, e);
  }}
  onAuxClick={(e) => {
    if (e.button === 1) {
      e.preventDefault();
      openUrl(url, e);
    }
  }}
>
```

（若项目用 `button` + `role="link"` 替代 `<a>`，同样禁止在未阻止默认时重复触发导航。）

---

### 3.4 未来扩展（Chrome MV3 / `chrome.tabs`）

若需 `chrome.tabs.create` / `update`，**仅**在 Layer 1 或紧挨 Layer 1 的**单一适配模块**内分支，**不得**在业务组件分散判断。

---

## 4. 整理模式（Arrange）与责任边界（已定死）

- **拦截位置**：整理模式下不因「打开站点」而导航 —— 判断在**发起调用的组件**（或父级点击处理）中完成：

  ```ts
  if (!isArrangeMode) {
    openUrl(url);
  }
  ```

- **`openExternalUrlImpl` / `useOpenExternalUrl` 内部不判断 `isArrangeMode`**，避免导航层依赖业务状态。

若父级已统一拦截点击，子组件不再调用 `openUrl`，则无需重复判断（以实际组件树为准，**禁止**在 helper 内兜底 arrange）。

---

## 5. 接线清单（与仓库实现同步）

| 区域 | 状态 | 说明 |
|------|------|------|
| `useUiPreferences` + `xallor_ui_open_links_in_new_tab` | 已落地 | 读/写、解析表见 §2；与 `layoutMode` 同属 `UiPreferencesProvider` |
| `openExternalUrlImpl` / `useOpenExternalUrl` | 已落地 | [`src/app/navigation/`](../../src/app/navigation/) |
| `SettingsSpotlightModal` + `SegmentedControl` + i18n | 已落地 | `data-testid`：`settings-link-open-new-tab` / `settings-link-open-same-tab`；文案 key：`settings.linkOpenBehavior*`（当前中文标题为「打开方式」） |
| `DesktopGridItemSiteBody` | 已落地 | 经 `openUrl`；arrange 在调用层 |
| `SearchBar` | 已落地 | 回车搜索经 `openUrl` |
| `DesktopGridFolderPreviewItem`、`DesktopGridFolderPortal` | 已落地 | §3.3；文件夹内链 `onAuxClick` 中键 |
| `UiPreferencesTestProvider` | 已落地 | 单测包裹用 [`UiPreferencesTestProvider.tsx`](../../src/app/preferences/UiPreferencesTestProvider.tsx) |
| `Sidebar` | 未接线 | 未来真实 `href` 时走同一 hook |

---

## 6. 测试策略

| 层级 | 内容 |
|------|------|
| 单元 | `parse` 与 §2 表一致；`openExternalUrlImpl` 分支；Hook 在修饰键 / `auxclick` 下强制新标签（可 mock event） |
| E2E | 可选：设置写入 + 存储断言；全路径导航受环境限制时可不强依赖 |

---

## 7. i18n（keys，与 `messages.ts` 同步）

- `settings.linkOpenBehavior`（标题；当前中文：**打开方式**）
- `settings.linkOpenBehaviorDesc`（说明；当前中文：**链接的默认打开位置。**）
- `settings.linkOpenNewTab` / `settings.linkOpenSameTab`（分段：**新标签页** / **当前标签页**；英文 New tab / Current tab）

---

## 8. 后续演进（非 v1，可选）

若未来存在「内部路由 / 搜索 / 外部 URL」等多类目标，可在**不破坏**现有 `openExternalUrl` 的前提下，引入**导航意图**（如 `type: "external" | "internal" | "search"`）并在**单一模块**内分发 —— **不作为本期交付范围**，避免 scope 膨胀。

---

## 9. 一句话原则

所有「打开外部 URL」的扩展（安全策略、扩展 API、未来 `chrome.tabs`）应在 **Layer 1 / 适配层** 集中处理；业务只使用 **`useOpenExternalUrl`**，并在 **arrange / `<a>`** 场景遵守 §4 与 §3.3。
