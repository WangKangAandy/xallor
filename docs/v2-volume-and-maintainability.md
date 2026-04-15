# v2：体积与可维护性（摘要）

与 [`persistence-architecture.md`](./persistence-architecture.md) 衔接；**上架、云同步**另立里程碑。

---

## 已完成（摘要）

- **体积**：主包与 `DesktopGrid` 等 chunk 基线见下表；已移除一批未使用依赖；**未引用的** `src/app/components/ui/`（整包 Radix + Recharts 等 shadcn 生成物）已删除，对应 npm 依赖已卸载（`depcheck` 可作后续复查）。`App` 与网格内部分模块懒加载。
- **结构**：`useGridPersistence`、`useGridDnD`、`useFolderResize`；网格类型/常量拆分；`DesktopGridItem` 拆为多个 Body + `DesktopGridResizeChrome` 等。
- **工程**：`tsconfig.json`（`strict`、`@/*`）、`eslint.config.js`、CI 与 `npm run typecheck` / `lint`。

---

## 后续可选（非阻塞）

- 再跑一轮 `depcheck` + 全仓 `import` 核对；未使用的 `ui/*` 与 Radix 包可按需删或懒加载。
- Playwright E2E 框架已接入（`@playwright/test` + `playwright.config.ts` + `e2e/arrange-gesture.spec.ts`）；后续持续补复杂交互场景（动态框选、批量移动、跨页）。
- ESLint / Prettier 规则按需收紧。

**原则**：小步、可回滚；改动后保持 `npm run test:run` 与手动 smoke（网格、文件夹缩放、持久化）。

---

## 基线（构建日志，供对比）

| 指标 | 值 | 日期 |
|------|-----|------|
| 主 JS gzip | ≈47.9 kB（`index-*.js`） | 2026-04-11 |
| 桌面网格 chunk gzip | ≈61.6 kB（`DesktopGrid-*.js`） | 2026-04-11 |
| 主 CSS gzip | ≈7.4 kB（移除未引用 `ui/` 后 Tailwind 扫描范围缩小） | 2026-04-11 |
| `node_modules` | 以本机 `npm install` 为准（此前参考 ≈170 MB 级） | — |

> 注：gzip 随依赖与拆包变化，以当前 `npm run build` 为准；更新路线图时改日期与数字即可。

**CI**：[`../.github/workflows/ci.yml`](../.github/workflows/ci.yml) — `npm ci` → `typecheck` → `lint` → `test:run` → `build`。

---

## 文档

路线图与维护焦点见 [`project-gaps-and-roadmap.md`](./project-gaps-and-roadmap.md)。
