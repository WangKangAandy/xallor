# 路线图与维护焦点

本文档保持**简短**：记录仍值得跟进的缺口；**已完成的 v1/v2 工程项**见下文「归档指针」，不再逐条罗列。

**当前阶段**：以**维护与重构**为主，优先**优化代码结构、边界与可测试性**，降低后续加交互/装饰层时的重构成本；不急于堆业务功能。

**优先级说明**：下文 **「高」专指工程结构债务**（拖延会显著抬高日后重构代价）。**外链、弱网、资源策略**属于**体验与运行环境**，与「结构高优」分列，避免和可扩展性目标混淆。

**排期说明**：下列「缺口」含**可持续跟进的工程项**与**面向未来的能力占位**（弱网、未来 API、上架等）；**未标注「紧迫」的不等于当前线上已有对应缺陷**，而是降低日后返工与体验风险的**提前约束**。

---

## 归档指针（已完成，详情见链接）

| 主题 | 说明 |
|------|------|
| 本地持久化 | [`persistence-architecture.md`](./persistence-architecture.md)、[`src/app/storage/`](../src/app/storage/) |
| MV3 新标签页 | [`public/manifest.json`](../public/manifest.json) + `vite.config.ts` 的 `base: './'`；扩展根目录用构建产物 **`dist/`** |
| 体积与结构拆分 | [`v2-volume-and-maintainability.md`](./v2-volume-and-maintainability.md)（含构建基线） |
| 工程基线 | 根目录 `tsconfig.json`、`eslint.config.js`；CI：[`../.github/workflows/ci.yml`](../.github/workflows/ci.yml) |

---

## 仍存在的缺口

### 高（结构 / 可扩展——优先做，防后期大重构）

- **网格与交互边界（持续）**：核心拆分与层级约定已落地（`DesktopGridItem` 为薄路由；详见 [`grid-interaction-boundaries-plan.md`](./grid-interaction-boundaries-plan.md)）。后续按需：**可选 layout 上下文**、继续用**纯函数 + 单测**收敛行为，避免把隐式规则写回 JSX。
- **依赖与产物卫生**：已移除未引用 `ui/`；仍建议定期 `depcheck` + 对照 `npm run build`，避免无用依赖回潮。
- **复杂交互回归**：关键路径逐步补测试（或后续 Playwright）；避免只靠手工点网格。

### 中（体验与资源——重要，但不等同于「结构高优」；多为面向未来）

- **外链资源（面向未来 / 弱网与扩展环境）**：背景图仍走 Unsplash、favicon 走第三方服务；在弱网或 CSP 收紧时可能不稳定。已用 [`RemoteBackgroundImage`](../src/app/components/feedback/RemoteBackgroundImage.tsx) 对**首页背景**做失败降级；其余可继续：**本地化或渐变兜底**、保持 **Favicon 多源链**；可独立里程碑。
- **错误与加载（基线已落地，可随功能扩展）**：展示层提供 [`RemoteContentPlaceholder`](../src/app/components/feedback/RemoteContentPlaceholder.tsx)（加载 / 失败 / 成功）；`storage/repository` 仅数据与校验（见文件头注释），**不**渲染占位组件。未来天气等 API 接入时包一层 `phase` 即可。

### 低（多在上架或接真实数据时）

- Manifest `icons`、商店素材；天气等接 API 时的权限与隐私文案。
- **安全**：自定义搜索引擎 URL 若完全开放，需防开放重定向（上架相关）。

---

## 扩展原则（面向后续功能，非实现承诺）

以下不绑定具体排期，仅约束方向，避免将来加「宠物 / 装饰层」时把主网格拖垮：

1. **分层**：背景 → 主内容（搜索 + 网格）→ **可选覆盖层**（角色、粒子等）应独立组件 + 明确 `z-index`；**覆盖层组件待有产品需求再实现即可**。App 与 `desktopGridLayers.ts` 已区分主内容与弹层 z-index；尽量不往 `DesktopGridItem` 内塞全局副作用（与当前实现一致）。
2. **坐标与 DOM**：网格项位置若需被外部引用（例如「蹲在图标上」），优先通过 **ref / 回调暴露几何信息** 或集中 **layout store**，避免到处 `querySelector`。
3. **动画**：已用 Motion 的 `layout="position"`；新增全页动画时注意性能与 `react-dnd` 预览层冲突，可单独里程碑处理。
4. **状态**：持久化继续走 `storage/repository`；纯 UI 装饰状态可与网格数据解耦，便于测试与回滚。

---

## 相关文件

| 文件 | 作用 |
|------|------|
| [`v2-volume-and-maintainability.md`](./v2-volume-and-maintainability.md) | 构建基线、历史拆分与后续可选任务 |
| [`grid-interaction-boundaries-plan.md`](./grid-interaction-boundaries-plan.md) | 网格 DnD/层级/文件夹视图模型拆分计划与进度参照 |
| [`package.json`](../package.json) | `build` / `typecheck` / `lint` / `test:run` |
