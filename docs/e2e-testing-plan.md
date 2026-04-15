# E2E 测试接入与计划（Playwright）

## 当前接入状态

- 测试框架：`@playwright/test`
- 配置文件：`playwright.config.ts`
- 用例目录：`e2e/`
- 首个样例：`e2e/arrange-gesture.spec.ts`

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

## 下一步场景清单（按优先级）

1. 整理模式动态框选：
   - 实体外起手进入
   - 拖动中动态增选
   - 回收路径动态取消
2. 批量删除/移动：
   - 选择后 `Delete` 批删
   - 拖入文件夹与跨容器移动
3. 跨页行为：
   - 边缘拖拽切页
   - 选择集跨页一致性
4. 持久化 smoke：
   - 拖拽后刷新保留
   - 搜索引擎设置刷新保留

## 约束与建议

- E2E 断言优先使用稳定标识（`data-testid` / 语义 role）。
- 复杂拖拽用多段 `mouse.move(..., { steps })`，避免一步跳跃导致误判。
- 只把“真实交互编排”放 E2E；纯计算逻辑继续留在单元测试。
