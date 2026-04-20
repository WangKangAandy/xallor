# E2E 测试接入与计划（Playwright）

## 当前接入状态

- 测试框架：`@playwright/test`
- 配置文件：`playwright.config.ts`
- 用例目录：`e2e/`
- 首个样例：`e2e/arrange-gesture.spec.ts`
- 当前已通过场景（串行执行验证）：
  - 空白区起手命中实体后进入整理模式
  - 拖动中动态增选 + 回收路径动态取消
  - 小于激活阈值（6px）不触发整理模式
  - 整理模式下按 `Delete` 执行批删
  - 文件夹外层选中后点 `⤢` 展开整理，点遮罩关闭后仍停留在外层整理模式
- Vitest 已排除 `e2e/**`，避免 `npm run test:run` 误跑 Playwright 用例（见 `vite.config.ts` 的 `test.exclude`）。

## 如何在本地运行

1) 安装浏览器（首次）：

```bash
npm run e2e:install
```

2) 执行 E2E：

```bash
npm run e2e
```

3) 交互调试：

```bash
npm run e2e:ui
```

## 配置说明

- E2E 启动独立 dev server：
  - `npm run dev -- --port 4173 --strictPort`
- 默认基地址：
  - `http://127.0.0.1:4173`
- 失败重试：
  - CI 下 `retries=1`，本地 `retries=0`

## 下一步场景清单（按优先级，更新）

1. 批量移动（B2-4）：
   - 外部项 + 文件夹内部项混合集移动
   - 拖入已有文件夹与跨容器移动一致性
2. 跨页行为：
   - 边缘拖拽切页
   - 选择集跨页一致性
3. 持久化 smoke：
   - 拖拽后刷新保留
   - 搜索引擎设置刷新保留

## 约束与建议

- E2E 断言优先使用稳定标识（`data-testid` / 语义 role）。
- 复杂拖拽用多段 `mouse.move(..., { steps })`，避免一步跳跃导致误判。
- 只把“真实交互编排”放 E2E；纯计算逻辑继续留在单元测试。
