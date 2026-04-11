# 路线图与维护焦点

本文档保持**简短**：记录仍值得跟进的缺口；**已完成的 v1/v2 工程项**见下文「归档指针」，不再逐条罗列。

**当前阶段**：以**维护与重构**为主，优先**优化代码结构、边界与可测试性**，降低后续加交互/装饰层时的重构成本；不急于堆业务功能。

**优先级说明**：下文 **「高」专指工程结构债务**（拖延会显著抬高日后重构代价）。**外链、弱网、资源策略**属于**体验与运行环境**，与「结构高优」分列，避免和可扩展性目标混淆。

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

- **网格与交互边界**：`DesktopGridItem` 仍偏厚；继续收拢 DnD、Motion、文件夹预览布局的职责，**补「布局/层级」约定**（例如独立覆盖层的 `z-index`、可选 layout 上下文），并以**纯函数 + 单测**固定行为，少依赖「散落在 JSX 里的隐式规则」。**执行计划**见 [`grid-interaction-boundaries-plan.md`](./grid-interaction-boundaries-plan.md)。
- **依赖与产物卫生**：已移除未引用 `ui/`；仍建议定期 `depcheck` + 对照 `npm run build`，避免无用依赖回潮。
- **复杂交互回归**：关键路径逐步补测试（或后续 Playwright）；避免只靠手工点网格。

### 中（体验与资源——重要，但不等同于「结构高优」）

- **外链资源**：背景图仍走 Unsplash、favicon 走第三方图标服务；弱网 / 扩展 CSP 下可能不稳定。优化方向：**本地化或渐变兜底**（背景）、保持/增强 **Favicon 已有降级链**；与「代码分层」无必然绑定，可独立排期。
- **错误与加载**：外链图、未来 API 的**统一降级 UI**（展示层），与存储层解耦。

### 低（多在上架或接真实数据时）

- Manifest `icons`、商店素材；天气等接 API 时的权限与隐私文案。
- **安全**：自定义搜索引擎 URL 若完全开放，需防开放重定向（上架相关）。

---

## 扩展原则（面向后续功能，非实现承诺）

以下不绑定具体排期，仅约束方向，避免将来加「宠物 / 装饰层」时把主网格拖垮：

1. **分层**：背景 → 主内容（搜索 + 网格）→ **可选覆盖层**（角色、粒子等）应独立组件 + 明确 `z-index`，尽量不往 `DesktopGridItem` 内塞全局副作用。
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
