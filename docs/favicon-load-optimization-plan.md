# 远程资源加载策略计划（Favicon 首期， 可量化）

## 1. 背景与问题

当前图标加载采用“串行候选源回退”：

1. `icons.duckduckgo.com`
2. `google s2`
3. `icon.horse`

当首选源慢响应（不报错但很慢）时，页面会长时间等待，导致刷新后图标“过一会才出现”。

---

## 2. 目标（项目级能力）

- 刷新后首屏图标更快稳定显示，减少“空白占位等待”时间。
- 波动网络下仍具备可预测的退化行为（不会长时间卡住）。
- 保留现有回退兜底（最终仍可显示首字母占位）。
- 能力不写死在图标组件：沉淀为“远程资源策略层”，后续可复用于背景图、远程封面等。

---

## 3. 量化指标（必须）

以“首屏可见图标集合”为统计口径，记录以下指标：

- `p50/p90 favicon_first_paint_ms`：单图标首次可见耗时
- `grid_visible_90p_ready_ms`：可见图标 90% 显示完成耗时
- `fallback_rate`：最终走到首字母占位的比例
- `provider_distribution`：各 provider 成功占比

对比方式：

- 同环境、同数据、同网络条件下对比“优化前 vs 优化后”
- 每组至少 20 次刷新采样，比较 p50/p90

---

## 4. 分阶段实施

### Phase F0（埋点与基线采样）✅ 已完成

- 在 `FaviconIcon` 增加轻量埋点：
  - 开始时间
  - 首次成功 provider
  - 成功/失败/fallback
- 输出到：
  - 开发态 `window.__faviconMetricsApi`
  - 项目级 `window.__remoteResourceMetricsApi`
- 先跑 20 次采样，记录 baseline。

验收：

- 能稳定导出 baseline 报表（p50/p90/fallback_rate/provider_distribution）。

---

### Phase F1（并发竞速 + 早到早用）✅ 已完成

- 将串行回退改为并发竞速（race）：
  - 多源同时请求，首个成功即渲染
  - 其余请求可忽略结果
- 保留最终失败时的首字母 fallback。

验收：

- 对比 baseline：`favicon_first_paint_ms` p50/p90 明显下降。

---

### Phase F2（成功源记忆）✅ 已完成（Favicon）

- 为每个 `key`（如 domain/资源标识）记忆最近成功 provider（`localStorage`）。
- 下次加载优先尝试上次成功源（可并发 + 优先策略结合）。

验收：

- 二次刷新场景下 p50 进一步下降。
- provider_distribution 更稳定。

---

### Phase F3（超时与防卡死）✅ 已完成

- `raceRemoteCandidates` 支持 `perCandidateTimeoutMs`（Favicon 默认 700ms，背景图默认 8s）。
- 单候选超时不阻塞其它候选；`FaviconIcon` 与 `RemoteBackgroundImage` 均已接入。
- 背景图在 URL 含 `w=` 时增加 `w=1280` 竞速候选，并写入 `background` 成功记忆。

验收：

- 弱网条件下 p90 改善明显，长尾等待下降（需按第 3 节自行采样对比）。

---

## 5. 回滚与风险

风险：

- 并发请求增多，瞬时网络请求数上升。
- 个别 provider 可能返回低质量图标或错误缓存。

控制：

- 设置并发上限（仅可见区域图标先触发）。
- 增加 provider 黑名单或短期失败熔断（后续可选）。
- 每阶段可单独回滚到上一步（F3 -> F2 -> F1）。

---

## 6. 文件改动建议

核心（项目级策略层）：

- `src/app/shared/remoteResourcePolicy.ts`
  - 多源候选排序（含成功记忆优先）
  - 并发竞速（race）
  - 通用指标采集与汇总
  - 面向后续资源（background/other）的扩展接口
- `src/app/shared/remoteResourcePolicy.test.ts`
  - 成功记忆读写、候选排序、**F3 单候选超时** 路径测试

接入进度：

- `src/app/components/shared/FaviconIcon.tsx`
  - 首个 consumer 接入策略层（已完成）
  - 保留 fallback 与统计口径
- `src/app/components/feedback/RemoteBackgroundImage.tsx`
  - 第二个 consumer（已完成）：`buildBackgroundCandidates` + 竞速/记忆/指标 + 单候选超时
- `src/app/components/shared/FaviconIcon.test.ts`
  - 验证候选构造与统计口径
- （可选）`docs/` 下记录一次基线与优化对比结果

---

## 7. 交付定义（Done）

- 用户主观体验：刷新后图标明显更快出现。
- 客观指标：`favicon_first_paint_ms` 与 `grid_visible_90p_ready_ms` 至少有一项达到 20%+ 改善（p50 或 p90）。
- 无功能回退：失败时仍有首字母 fallback，不出现空白永久占位。

---

## 8. 开发态采样方式（当前可用）

- 刷新前先执行（DevTools Console）：
  - `window.__faviconMetricsApi?.reset()`
- 连续刷新采样（建议 20 次），每次等待首屏图标稳定后记录。
- 汇总时在 Console 读取：
  - `window.__faviconMetricsApi?.read()`
- 快速统计：
  - `window.__faviconMetricsApi?.summarize()`
- 项目级统计（跨 consumer）：
  - `window.__remoteResourceMetricsApi?.summarize()`

---

## 9. 下一步（跨组件落地）

- ~~将 `RemoteBackgroundImage` 接入 `remoteResourcePolicy`~~（已完成）。后续可按弱网数据继续调参（`DEFAULT_*_TIMEOUT_MS`、候选 URL 列表）。
- 在 roadmap 中按“已完成/待办”持续跟踪缓存与加载加速进展；**建议补一轮 F3 前后 p90 采样**。

