# 右键菜单事件治理契约（实体优先，空白兜底）

## 1. 目的

统一新标签页右键事件的判定与处理链，避免出现：

- 同一区域既弹浏览器原生菜单又弹自定义菜单；
- 新增组件后右键被背景菜单抢占或穿透；
- 输入框/可编辑区域右键语义被误拦截。

## 2. 核心规则（判定优先级）

`contextmenu` 统一按以下顺序处理：

1. **disabled 优先**：命中 `data-context-disabled="true"` -> 不处理（不弹自定义菜单）。
2. **editable 放行**：命中输入语义区域 -> 放行原生右键，不做 `preventDefault`。
3. **entity 归属**：命中实体区域 -> 由实体自身决定自定义菜单或原生菜单。
4. **background 兜底**：均未命中 -> 由背景菜单入口统一 `preventDefault` 后打开自定义菜单。

补充说明：

- **最近命中优先**：嵌套实体按 `event.target.closest(...)` 命中的最内层实体归属。
- **命中即终止**：实体命中后不得继续触发背景菜单。
- 当前仓库的自定义右键入口通过 `useGridContextMenu` 统一执行 `preventDefault + stopPropagation`，避免双菜单同弹。

## 3. 当前实体范围（v1）

- 图标卡片（site / folder / widget）
- 搜索框与其下拉
- 侧边栏及其交互区

除以上区域外，均视为可触发背景右键菜单的空白区。

## 4. 可扩展接入约定

### 4.1 标记规范

实体根节点统一添加：

- `data-context-entity="true"`

可选语义细分：

- `data-context-entity-type="site|folder|widget|search|sidebar|..."`
- `data-context-role="card|toolbar|input|container|..."`

治理扩展标记：

- `data-context-disabled="true"`：该区域禁用自定义右键语义。
- `data-context-native="true"` 或 `data-allow-native-context="true"`：明确保留原生右键。

> Portal 浮层约束：若浮层语义上属于某实体，且未来接入 document 级监听，浮层根节点也应标记 `data-context-entity="true"`，避免被误判为空白区。

### 4.2 背景菜单判定

背景右键处理按以下顺序判定：

1. 命中 `data-context-disabled` -> 不处理；
2. 命中输入语义区域（`input/textarea/contenteditable/data-context-native/data-allow-native-context`）-> 放行原生；
3. 命中实体（`[data-context-entity='true']`）-> 交给实体；
4. 均未命中 -> `preventDefault` + 打开背景菜单。

> 说明：该契约定义“判定优先级与归属”，不强制实体必须使用自定义菜单或原生菜单。
> 当前实现为“局部监听 + hook 复用”，不是 document 全局捕获监听；若未来迁移全局入口，仍应保持同一优先级链。

## 5. 新增实体接入清单（必须）

每新增一个可交互实体，必须同时完成：

1. 根节点打 `data-context-entity="true"` 标记；
2. 明确 `type` 与 `role`（如 `site + card`、`widget + toolbar`）；
3. 明确右键策略（自定义 / 原生 / 禁用）；
4. 增加至少一个回归测试，覆盖“实体内右键不触发背景菜单”；
5. 若实体有浮层，补“浮层内右键不穿透到背景”的测试；
6. 若实体含输入编辑区，显式标注 `data-context-native` 或验证 editable 放行逻辑。

## 6. 回归测试建议

- 空白区右键 -> 打开背景菜单；
- 图标/文件夹/组件上右键 -> 不触发背景菜单；
- 搜索输入框与编辑输入框右键 -> 保留原生输入语义；
- 侧边栏区域右键 -> 不触发背景菜单；
- 嵌套实体右键 -> 最内层实体优先；
- `data-context-disabled` 区域右键 -> 不触发任何自定义菜单；
- 新增实体（未来）右键 -> 命中其自身策略。

## 7. 与现有文档关系

- 本文档定义“右键事件判定优先级与标记协议”；
- 模态遮罩与穿透阻断仍遵循 `pointer-and-layering-contract.md`；
- 若两者冲突，以“模态阻断优先”再进入右键判定。
