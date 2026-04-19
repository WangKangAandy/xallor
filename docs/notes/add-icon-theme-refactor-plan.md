# 添加图标弹层主题化重构计划

本文档说明如何通过 **token + 壳层原语（按需）** 让「添加图标 / 组件」界面随**设置中的外观主题**（`colorScheme` → `applyColorScheme` → `html.dark` + `color-scheme`）变化；**优先**减少重复样式与裸 `gray-*`，**不**求在一版内完成「平台级 design system 治理」。

**关联文档**：[theme-color-scheme-implementation-plan.md](./theme-color-scheme-implementation-plan.md)（4a / 4b、语义变量分层）、[glass-theme-unification-plan.md](../glass-theme-unification-plan.md)（若存在，与 `--glass-*` 约定对齐）。

---

## 1. 目标与非目标

### 目标

- 添加图标弹层（遮罩、主壳、左栏、右栏预览、tile、空状态）在浅色 / 深色 / 跟随系统下**可读、层次一致**。
- 与设置中的主题**同一套机制**：仅依赖全局 **`applyColorScheme` 的结果**（`document.documentElement`）。弹层 `createPortal` 到 `document.body` 仍在 `.dark` 树下，**行为正确**。
- **不在**添加图标模块内维护第二套主题偏好或重复订阅 `matchMedia`。

### 非目标（本阶段可不做）

- 不把「添加图标」做成脱离全局主题的独立开关。
- 不强制在本 PR 内完成整个 `SettingsSpotlightModal` 与添加图标的壳层合并（可作为第二阶段，见第 7 节）。

---

## 2. 问题根因

1. **主题已接入设置**：`UiPreferences` + `src/app/theme/` 负责 preference 与 DOM；添加图标**无需再「接线」**到 Context 才能变色。
2. **缺口在表现层**：`src/app/components/addIcon/*` 大量使用 `text-gray-*`、`bg-white/*`、`border-gray-*` 等**与 `html.dark` 无关**的写死色。
3. **`theme.css` 的 `.dark` 块**当前主要覆写语义色（`--background`、`--foreground` 等）与部分网格 token；**`--glass-panel-*` 等玻璃 token 若未在 `.dark` 覆写**，则 `GlassSurface variant="panel"` 在深色下仍可能偏浅。
4. 若仅在各 TSX 上加 `dark:`，改动分散、难维护，与「不打补丁」目标相反。

---

## 3. 分层模型（与主题总计划对齐）

| 层 | 职责 | 本计划动作 |
|----|------|------------|
| **L1** `src/styles/theme.css` | `:root` / `.dark` 下 CSS 变量（含既有 `--glass-*`、语义色） | **集中**补深色可读性；**优先**复用/覆写现有变量，**不必**在一版内完成「三桶」硬分类（见 §3.1 **软约束**）。 |
| **L2** 壳层原语 | 遮罩、搜索行、Tab、卡片等可复用壳 | **见 §3.2**：跨域 + 稳定性 + 语义通用性综合判断，再决定是否进 `shared/`。 |
| **L3** `addIcon/*` | 布局与业务 | **不写主题状态**（不读 `colorScheme`）；**优先**语义类 / token；**允许少量** `dark:` 作 **fallback**（见 §3.3）。 |

---

## 3.1 L1：token 命名——**软约束**为主（避免过早平台化）

当前仓库**只有一份** `theme.css` 在演进，design system **尚未定型**。下列为**推荐方向**，不是每一行都要过会的**硬规则**：

- **优先**：扩写 / 覆写已有 **`--glass-*`**、**`--background` / `--card` / `--border`** 等，减少「surface vs glass-panel」的命名纠结。  
- **可选北向**（待体系稳定后再收紧）：把新通用变量大致归到 **color / surface / elevation** 三类 mentally，避免无意义别名爆炸。  
- **短期允许业务变量**（现实策略）：例如 **`--add-icon-preview-bg`**，用于仅添加图标需要的特殊预览底。**泄漏控制**比「禁止前缀」更重要：  
  - **约定**：仅 **`src/app/components/addIcon/**`**（及 `theme.css` 中带「仅 addIcon 消费」注释的块）引用该类变量；**禁止**在设置、文件夹等其它业务组件使用。  
  - **可选增强**：在 `AddIconDialog` 根节点加 **`data-ui-surface="add-icon"`**，把业务变量定义在该选择器下，用级联收窄默认值（仍可在 `.dark` 下覆写）。

#### `theme.css` 内分区：**软分区、非强约束**（缓解「半业务半系统」）

允许 `--add-icon-*` 的**真实风险**是：时间久了 `theme.css` 读起来像大杂烩，**拆 design system 时成本高**。对策不是立刻禁止业务前缀，而是用**文件内分区**标明**预期寿命**，便于以后整段迁移或删除：

| 分区（注释区标题即可） | 含义 | 典型内容 |
|------------------------|------|----------|
| **system** | 与 shadcn / 全局语义强绑定，尽量少动 | `--background`、`--foreground`、大部分 `--glass-*` 基线 |
| **app** | 全 app 共用、比 feature 稳定、但可能调整 | 例如全页 veil、侧栏级 token（若已有） |
| **feature** | **临时 / 按功能收敛**，迁移或删除时**整段 grep** | **`--add-icon-*`**、其它「单域实验」变量 |

**约定**：添加图标专用变量放在 **`/* feature: add-icon */`**（或等价标题）下；**不**与 system 块交叉穿插。未来若要拆包：可整段移到 `theme-add-icon.css` 再由 `index.css` 引入——**非本迭代必做**，先有分区意识即可。

**与 §10 的关系**：「三桶 + 禁止业务前缀」可作为 **design system 成熟后**的治理规则；**本迭代**以软约束 + **分区** + 泄漏控制为准。

---

## 3.2 L2：何时抽到 `shared/`——**多维度判断**，避免 `shared/` 变坟场

问题本质是 **重复写样式**；「≥2 业务域」**必要但不充分**——否则两个业务为了省事共用一个**还不稳定**的壳，`shared/` 会变成**复制粘贴 + 不敢改**的堆场。

建议用下面三条做 **advisory checklist**（非数学公式，review 时对一下即可）：

| 维度 | 含义 | 反例（不要放进 `shared/`） |
|------|------|------------------------------|
| **跨 domain** | ≥2 个业务目录会 import | 仅 `AddIconPreviewPanel` 这种整块业务面板 |
| **稳定** | API（props）与视觉角色在 **1～2 个 PR 内不反复推翻** | 仍在剧烈改交互的实验壳 |
| **视觉语义通用** | 角色可描述为「任意对话框遮罩」「任意顶部搜索条」而非「添加图标第二步」 | 强绑定添加图标文案/布局的组件 |

**示例（示意）**：`ModalScrim` 类遮罩 → 易满足三条 → **适合** `shared/`；`SearchBar` 已是全局业务组件，**不必**为了「shared」名头再挪目录，关键是**是否被多域复用 + 边界清晰**；`AddIconPreviewPanel` → **应留在** `addIcon/`。

**职责**仍建议：抽到 `shared/` 的壳 **无业务文案、无业务状态机**；`selected` 等展示态由调用方传入。

---

## 3.3 L3：`dark:` 与主题——**禁止业务层主题逻辑**，允许 fallback（**要有边界**）

| 应该避免 | 推荐 |
|----------|------|
| 在 `addIcon` 里 **`useUiPreferences().colorScheme`**、自建 `matchMedia`、与全局 `applyColorScheme` 打架 | 主题只由设置 + `theme/` runtime 驱动；弹层只消费 **`html.dark` 已生效** 后的样式 |
| 大面积、无规律的 `dark:` 补丁 | **优先** token / `bg-card` / `text-muted-foreground` 等语义类 |

**允许**：在 token 或语义类**尚未覆盖**的边角，**少量** `dark:` 作为 **fallback**。

#### 对「只允许修 UI bug、禁止用 dark: 做设计/结构」的**诚实评估**

- **合理之处**：防止 `dark:` 成为**第二套主题实现**，最后比 token 还难删；「禁止用 `dark:` 表达结构（仅因主题而改 flex/grid/顺序）」在多数产品里**也成立**——深浅色应**同构**，差异应在色与对比度。  
- **字面「仅允许 token 未覆盖的 bug」过严**：新屏第一版往往**先**有一行 `dark:` 再补 token，硬说成「只能是 bug」在流程上不自然；审查时也容易扯皮。  
- **更可执行的边界（推荐）**：  
  1. **`dark:` 不作为主题的主路径**：每个文件里，**主题差异**应主要由 **token / 语义类**承担；`dark:` 只填补缺口。  
  2. **每条 fallback 建议带 TODO**（或 issue）：指向「补哪个 L1 变量或语义类后可删」，避免永久补丁。  
  3. **禁止**：纯为「在深色里换一种版式」而加 **`dark:` 改布局**（与浅色结构不一致）；**禁止**用 `dark:` **堆出一整块**本应属于设计 token 的配色（即「用 `dark:` 画 UI」）。  
  4. **可选量化**：单文件 `dark:` **超过若干处**（如阈值由团队定）必须在 PR 说明原因，否则要求先补 token。

**结论**：你的方向**对**，但把规则写成 **「主路径 + TODO + 禁止结构分叉 + 防铺量」** 比单写「仅 bug」更稳、更少误伤。

---

## 4. L1：`theme.css` 建议增量（务实顺序）

1. **深色下大面板 / 浮层**  
   - **优先**：在 `.dark` 覆写 **`--glass-panel-*`**，让现有 `GlassSurface variant="panel"` 直接受益。  
   - 若 `panel` 影响面过大：再考虑 **`GlassSurface` 新档位** + 一组**通用**变量（命名可用 `surface-*` 或继续 `glass-*`，**不**强制在一版内统一命名体系）。

2. **遮罩（scrim）**  
   - 抽成变量（名用 **`--surface-scrim`** 或 **`--scrim-bg`** 等短名均可），替换 `bg-black/35` 硬编码；`:root` / `.dark` 各一档或共用半透明黑亦可。

3. **预览区等特殊块**  
   - **优先**通用色：`--color-success-subtle` + `card`/`muted`。  
   - **可接受**：**`--add-icon-preview-bg`** 等（须遵守 **§3.1 泄漏控制**）。

---

## 5. L2 / 私有壳层（按需拆分）

**草案**（名称仅示例；若仅 AddIcon 使用，文件可放在 `addIcon/` 下）：

| 壳层 | 用途 |
|------|------|
| `ModalScrim`（或 `AddIconModalScrim`） | 全屏点击关闭；背景用 §4 遮罩变量或 fallback。 |
| 搜索行 / Tab / 预览外框 / 底栏 | 优先语义类；重复多则抽 1～N 个小组件，**不设数量上限**，按 **§3.2** 决定是否进 `shared/`。 |

**原则**：减少裸 `gray-*` / `white/*`；**不**追求「零 `dark:`」。

---

## 6. L3：`addIcon/*` 实施顺序

1. **`AddIconDialog.tsx`**：`ModalScrim` 替换遮罩；主壳保持 `GlassSurface variant="panel"`（或 **`floating`** 等新档位，见 §4），依赖 L1 token。  
2. **`AddIconPickerPanel.tsx`**：搜索、Tab、空状态 → **§3.2**：可抽 `addIcon` 私有壳层或已升 `shared/` 的原语 + 语义类；侧栏分隔线用 `border-border`。  
3. **`AddIconPickerSection.tsx` / `AddIconPickerTile.tsx`**：标题与 tile 用 `text-muted-foreground`、`bg-muted`、选中态用 `ring-ring` / `border-primary` 等（避免散落的 `blue-500` 除非映射到 design token）。  
4. **`AddIconPreviewPanel.tsx`**：预览卡优先语义类 / 通用 token；必要时 **`var(--add-icon-*)`**（§3.1 泄漏控制）；注意代码中 `variant === "dark"` 表示**图标反色选项**，与主题无关，**勿改名**。  
5. **`GridAddSlotCell.tsx`**：仅在与深色网格冲突时小改，优先消费网格或语义 token。  
6. **测试**：保留现有行为与文案断言；可选增加「`document.documentElement.classList.add('dark')` 后仍能完成添加流程」的用例；**不为每个子组件堆叠 `dark:` 快照断言**。

---

## 7. 第二阶段（可选）：与设置弹窗收敛

`SettingsSpotlightModal` 当前仍有较多 4a 时期的 `dark:`。在添加图标完成后，若 **`shared/` 下已有**遮罩/浮层壳等，再将设置外壳**逐步对齐**同一套实现与 token，减少重复；**不**强求两域同一 PR 完成。

---

## 8. 风险与缓解

| 风险 | 缓解 |
|------|------|
| 修改 `--glass-panel-*` 影响所有 `panel` | 实施前 **grep `variant="panel"`**；影响面大则 **新 GlassSurface 档位** + 独立变量组。 |
| 语义色 + 玻璃叠层发灰 | 对照设计稿微调；**允许**局部 fallback `dark:`（§3.3）。 |
| `--add-icon-*` 泄漏到其它业务 | Code review / grep：**仅** `addIcon/**` 引用；可选 **`data-ui-surface`** 级联收窄。 |
| 过早硬治理拖慢交付 | 默认 **§3.1 软约束**；硬三桶与「禁止业务前缀」留到 **design system 稳定后**（与 §10 对齐）。 |
| `theme.css` 半业务半系统、难拆 | **§3.1 文件内分区** + feature 变量整段可 grep；中长期可拆文件，非本迭代必做。 |

---

## 9. Definition of Done

- [ ] **不**在添加图标内引入**独立主题状态**（不读 `colorScheme`、不自建 system 监听）；仍依赖全局 `html.dark`。  
- [ ] 遮罩与主壳**主要**来自 **`theme.css` / 语义类 / `GlassSurface`**；边角允许 **少量 fallback `dark:`**（§3.3）。  
- [ ] 若存在 **`--add-icon-*`**：grep 确认**无** `addIcon` 外引用；且在 `theme.css` 中落在 **§3.1「feature」注释分区**（或等价注释块）。  
- [ ] `npm run typecheck` 与相关 **Vitest** 通过。

---

## 10. 北向目标：与「浏览器导航 UI design system」的关系

**方向**：当 `shared/` 壳层与 `theme.css` 变量被多个业务复用时，自然逼近「导航 UI design system」；**不必**在本迭代自称 **v1 完成**。

**分阶段**：当前文档以 **§3.1 软约束 + 泄漏控制 + §3.3 fallback** 为主；**硬三桶、禁止业务前缀、严格治理**可在 **单一真源设计稳定后**再写进 AGENTS / 单独 governance 文档，避免**过早设计**拖慢 AddIcon 交付。

---

## 11. 当前问题与 TODO

- [ ] **TODO: 全量 Vitest 偶发超时（非稳定复现）**  
  现象：`npx vitest run` 在高负载时偶发 `DesktopGridModule.test.ts` 45s 超时；单测单独重跑可通过。  
  建议：将该用例拆成更轻量断言或显式提高 timeout，并排查动态导入链路在并行环境中的等待点。
- [ ] **TODO: `--glass-panel-*` 深色覆写的跨面板回归巡检**  
  现象：本次为 AddIcon 可读性调整了 `.dark` 下 `--glass-panel-*`，该变量也影响文件夹/组件 panel。  
  建议：补一轮视觉回归清单（AddIcon、FolderPortal、WidgetPanel），确认深色下阴影、边框与对比度一致。
- [ ] **TODO: fallback `dark:` 清理台账**  
  现象：当前允许少量 `dark:` 作为缺口补丁。  
  建议：为新增 fallback 标注 TODO 注释并建立清理台账，后续由 L1 token 覆盖后移除。

---

*文档版本：已按「软约束 / 业务 token 泄漏控制 / 按复用升 shared / 允许 fallback dark:」修订；新增“当前问题与 TODO”跟踪项，随实现更新 checklist。*
