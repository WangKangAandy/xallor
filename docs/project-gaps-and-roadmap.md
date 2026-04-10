# 项目不足与待优化（路线图）

本文档总结当前仓库的短板、后续优化方向；并记录 **MV3 新标签页（构建产物接入）** 的落地方式。

---

## 已落实：优化 1 — `npm run build` 接入 Manifest V3

### 做了什么

| 项 | 说明 |
|----|------|
| [`public/manifest.json`](../public/manifest.json) | MV3 清单；`chrome_url_overrides.newtab` 指向 **`index.html`**（与 Vite 构建出的入口一致）。`public/` 下文件会在 `vite build` 时**原样复制到 `dist/` 根目录**。 |
| [`vite.config.ts`](../vite.config.ts) 中 `base: './'` | 资源使用**相对路径**（如 `./assets/...`），在 `chrome-extension://` 下可正确加载，避免绝对路径 `/assets/...` 失效。 |

### 如何验证新标签页能加载 `dist`

1. 执行：`npm run build`。
2. 打开 Chrome：`chrome://extensions` → 开启「开发者模式」→ **加载已解压的扩展程序**。
3. 选择本项目的 **`dist` 文件夹**（内含 `index.html`、`manifest.json`、`assets/`）。
4. 新开标签页：应显示本项目的 React 界面。

> 说明：扩展根目录必须是 **`dist`**，这样清单里的 `"newtab": "index.html"` 才能与构建产物对齐。若把扩展根设在仓库根目录，则需把 `newtab` 改成 `"dist/index.html"` 并保证相对资源路径仍正确；当前方案以 **`dist` 为扩展根** 为推荐做法。

---

## 当前项目不足

### 数据与功能

- **无持久化**：网格、搜索引擎、重命名等均在内存中，刷新即丢失；扩展场景通常需要 `chrome.storage` 或等价存储。
- **天气等组件为静态占位**：未接 API，无错误态与加载态。
- **侧栏菜单**：仅为 UI，无路由或真实功能入口。

### 性能与体积

- **依赖偏多**：Radix 全套、MUI、图表/轮播等可能未全部使用，**安装体积与构建产物偏大**（当前 `build` 主 JS 约数百 KB gzip 量级，随依赖与代码增长）。
- **外链资源**：背景图（Unsplash）、favicon（DuckDuckGo 服务）依赖网络与第三方；弱网、隐私与扩展 CSP 策略需单独评估。
- **未见按需拆分**：重模块未普遍做 `React.lazy` / 动态 import。

### 工程与质量

- **根目录可能缺少 `tsconfig.json`**：与严格类型检查、路径一致性相关（以仓库实际为准）。
- **测试与 CI 缺失**：回归主要靠手工。
- **`DesktopGrid` 等单文件职责偏重**：拖拽与合并逻辑集中，长期维护成本高。

### 安全与扩展合规

- **自定义搜索引擎 URL**：若允许任意字符串，需防范开放重定向等；上架商店时审核会关注。
- **Manifest**：当前仅为最小 newtab 覆盖；若后续使用 `chrome.tabs`、跨域请求等，需补充 `permissions` / `host_permissions` 并更新说明。

---

## 待优化点（建议优先级）

### 高

1. **持久化**：使用 `chrome.storage.local`（或 `sync`）保存网格与搜索引擎配置；定义数据版本字段便于迁移。
2. **依赖审计**：移除未使用的大依赖，或对重型库做懒加载，控制扩展包体积。
3. **资源策略**：背景图本地化或可选；favicon 缓存、降级或改用 `chrome://favicon` 等扩展能力（需权限与 API 调研）。

### 中

4. **重构大组件**：将 `DesktopGrid` 状态与交互拆到 hook / 子模块，便于测试。
5. **错误与加载边界**：外链图片、favicon、未来 API 的统一降级 UI。
6. **补充 `tsconfig.json` 与基础 ESLint**：统一类型与风格（按需）。

### 低

7. **Manifest 图标**：为商店与浏览器工具栏准备 `icons`（当前最小清单可本地调试，上架需图标规范）。
8. **天气等小组件**：接真实 API 时再处理权限、配额与隐私文案。

---

## 相关文件

| 文件 | 作用 |
|------|------|
| [`public/manifest.json`](../public/manifest.json) | MV3 清单源码，构建后位于 `dist/manifest.json` |
| [`vite.config.ts`](../vite.config.ts) | `base: './'` 与插件配置 |
| [`package.json`](../package.json) | `npm run build` 产出 `dist/` |
