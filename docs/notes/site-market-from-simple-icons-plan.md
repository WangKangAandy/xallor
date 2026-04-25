# 基于 simple-icons 构建「站点市场」计划

本文说明如何将 [simple-icons/simple-icons](https://github.com/simple-icons/simple-icons) 作为**数据源之一**，生成可供「站点与组件 → 查看更多」加载的站点目录（site market），并与当前 `AddIconCatalogEntry` / `FaviconIcon(domain)` 方案对齐。

---

## 1. 获取上游数据

### 1.1 Git 浅克隆（推荐用于本地探索与一次性脚本）

在仓库根目录执行（**优先** GitHub 官方源，与上游完全一致）：

```bash
mkdir -p vendor
git clone --depth 1 https://github.com/simple-icons/simple-icons.git vendor/simple-icons
```

若当前网络无法访问 GitHub，可使用 **Gitee 上的社区镜像**（同步可能滞后于官方，仅作本地拉取备选）：

```bash
mkdir -p vendor
git clone --depth 1 https://gitee.com/ice-kylin/simple-icons.git vendor/simple-icons
```

- 本仓库已在 `.gitignore` 中忽略 `vendor/simple-icons/`，避免误提交整仓。
- 聚合数据文件路径以克隆结果为准：
  - 官方仓库常见为 `data/simple-icons.json`（分支/版本不同可能略有差异）。
  - 上述 Gitee 镜像当前为 `vendor/simple-icons/_data/simple-icons.json`。

### 1.2 不克隆：仅用 npm（推荐用于 CI / 可复现构建）

将 `simple-icons` 作为 **devDependency**，在构建脚本中 `import icons from 'simple-icons/icons'` 或读取包内 `data/simple-icons.json`（以包版本内实际路径为准）。优点：版本锁死、CI 无需 `git clone`、体积分摊在 `node_modules`。

---

## 2. 上游数据结构（与映射有关）

每条图标大致包含（字段名以 `simple-icons.json` 为准）：

| 字段 | 用途 |
|------|------|
| `title` | 展示名候选 |
| `slug` | 稳定 id、文件名、可推导域名候选 |
| `hex` | 可选：市场卡片主题色 / 占位 |
| `source` | 官方来源 URL（常为品牌页或首页，**不一定**是用户应保存的「主站入口」） |
| `guidelines` / `license` | 合规与品牌限制参考 |

**注意：** Simple Icons 是**品牌图标库**，不是「新标签页推荐站点」产品；`source` 有时是子路径或媒体页，需规则 + 人工 allowlist 纠偏。

---

## 3. 目标产物（与现有代码对齐）

与 `src/app/components/addIcon/addIconCatalog.ts` 中站点条目一致，建议生成中间格式再合并进目录或单独 JSON：

```ts
// 与 AddIconCatalogSite 对齐
{
  "kind": "site",
  "id": "market-github",           // 建议前缀 market- 或 si-{slug} 避免与内置 cat-site-* 冲突
  "name": "GitHub",
  "domain": "github.com",
  "url": "https://github.com"
}
```

图标展示：**继续用现有 `FaviconIcon` + `domain`**，首版不必内嵌 Simple Icons SVG（减少商标展示与 CSP 体积问题）；后续可做「可选高清 SVG 覆盖」。

---

## 4. 构建流水线（建议分阶段）

### 阶段 A — 原型脚本（Node，`scripts/`）

1. **输入**：`simple-icons.json`（来自 vendor 或 npm 包）。
2. **过滤**：
   - 仅保留 allowlist：`slug` ∈ `scripts/site-market-allowlist.json`（首版 50～200 条，人工可审）。
   - 或排除已知非网站品牌（无公共首页的 slug，需维护 denylist）。
3. **URL / domain 推导**（优先级从高到低）：
   - 若维护 `slug → { url, domain }` 映射表（JSON），优先用映射表（**准确率最高**）。
   - 否则从 `source` 用 `URL` 解析出 `hostname` 作为 `domain`，`origin` 或规范化为 `https://…/` 作为 `url`。
   - 启发式：`https://{slug}.com` 仅作 fallback，且必须经 `HEAD`/`DNS` 或静态已知表校验（CI 可跳过网络，仅用静态表）。
4. **输出**：
   - `src/app/components/addIcon/siteMarket.generated.json`（或 `public/site-market.v1.json` 若要走 CDN）。
5. **校验**：`url` 合法、`domain` 与 `url` 一致、无重复 `id`；可选 `npm run typecheck` 前用 zod/io-ts 生成 TS 类型。

### 阶段 B — 「查看更多」产品行为

1. UI：侧栏/设置内 **站点市场** 面板（全屏 modal 或二级路由），列表/搜索复用现有 `useAddIconCatalogModel` 的筛选逻辑或单独 hook。
2. 数据加载：**首屏内置精简表** + 可选 fetch 远程 `site-market.v1.json`（与路线图里混合方案一致）；失败回退内置。
3. 选择条目：与当前 picker 一致 `setSelectedCatalogId`，右侧预览与「添加」流程不变。

### 阶段 C — 合规与运营

1. **许可**：Simple Icons 数据为 **CC0**；各品牌使用仍须遵守其 `guidelines`（若有）。
2. **商标**：首版以 favicon + 名称为主；若展示 Simple Icons SVG，需在文档中说明来源与是否混编。
3. **更新节奏**：allowlist 月更或随版本发布；全量自动从 3000+ 品牌生成不推荐（噪声与错误 URL 多）。

---

## 5. 验收标准（建议）

- 生成 JSON 通过类型校验 / schema 校验。
- 随机抽 20 条在浏览器中打开 `url`，确认可达且与名称一致。
- 与内置 `ADD_ICON_CATALOG` 无 `id` 冲突；搜索、筛选、添加一条端到端可用（极简模式下仍遵守现有禁用策略）。

---

## 6. 推荐决策小结

| 方式 | 适用 |
|------|------|
| `vendor/` 浅克隆 | 本地调映射、看原始 JSON/SVG |
| npm `simple-icons` + allowlist 脚本 | **团队默认**：可复现、可 CI、不把上游整仓打进 Git |
| 全量自动 slug → URL | **不推荐**作唯一来源，错误率高 |

---

## 7. 若当前环境无法 clone

在可访问 GitHub 的机器上完成 clone 后，将 `data/simple-icons.json` 复制到本仓库任意路径并在脚本中配置 `SIMPLE_ICONS_DATA` 环境变量指向该文件即可；或直接使用 `npm i -D simple-icons@<version>` 在脚本中读取包内数据。
