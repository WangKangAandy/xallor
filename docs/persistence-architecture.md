# 持久化架构说明（v1）

本文档定义 xallor 当前的本地持久化方案，以及未来接入账号与远程同步时的扩展路径。

## 目标

- 本地刷新不丢数据（网格、文件夹、搜索引擎设置）。
- 不做大规模重构前提下，让数据层具备后续云同步能力。
- 通过轻量 UT 保护核心行为，避免后续改动破坏端到端功能。

## 存储分层

- `src/app/storage/adapter.ts`
  - 屏蔽运行环境差异。
  - 扩展环境优先 `chrome.storage.local`。
  - 本地开发环境 fallback 到 `localStorage`。
- `src/app/storage/repository.ts`
  - 负责读写 key、结构校验、默认值回退、迁移钩子。
- `src/app/storage/types.ts`
  - 定义 envelope 与 payload 的结构。

## 数据结构（Envelope + Payload）

每类业务数据按 key 分区存储（`grid` / `search`），并统一包裹为 envelope：

- `version`: schema 版本（当前为 `1`）
- `userId`: 当前用户标识（当前固定为 `anonymous`）
- `deviceId`: 本地设备 ID（本地生成并复用）
- `updatedAt`: 最近写入时间
- `payload`: 业务负载

这套结构可以在未来直接迁移到「用户维度 + 多设备同步」模型。

## 迁移策略（v1 -> future）

`repository.ts` 中提供 `migrateEnvelope()` 作为轻量迁移入口：

- 当前支持 `version === 1` 直接读取。
- 未来新增版本时，按 `v1 -> v2 -> v3` 链式迁移。
- 未识别版本直接回退默认值，确保 UI 可用。

## 质量保障：测试策略

当前先做不侵入业务的 UT，覆盖持久化核心逻辑：

- 版本不兼容时回退默认值。
- `selectedEngineId` 缺失时自动修正。
- 保存时生成完整 envelope 元数据。

测试文件：

- `src/app/storage/repository.test.ts`

运行命令：

- `npm run test:run`

端到端保护（建议下一步）：

- Playwright E2E 已独立接入：`playwright.config.ts` + `e2e/`，可直接补浏览器级 smoke case（扩展页加载、拖拽后刷新保留、新增搜索引擎后刷新保留）。
- 当前状态：已落首个整理模式手势样例；后续按里程碑补齐持久化相关回归场景。

## 后续扩展（云同步）

建议后续在不改变组件层 API 的情况下增加：

1. `sync adapter`（远程读写）
2. 登录态 `userId` 注入
3. 冲突策略（先 Last Write Wins）
4. 增量同步与失败重试

通过保持 repository 接口稳定，可以避免重构组件时产生二次适配成本。

