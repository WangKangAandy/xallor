# Favicon 加载前后对比模板

## 1) F3 阶段性结果（用于决策）

> 以下为 2026-04-15 的大样本仿真结果（20,000 样本/场景），用于判断 F3 是否“方向正确”。  
> 真实环境验收请使用第 3 节与第 4 节的浏览器采样脚本。

### 场景A：常规网络

| 指标 | F2（无单候选超时） | F3（700ms 超时） | 变化 |
|---|---:|---:|---:|
| p50 (ms) | 128.34 | 128.95 | -0.48% |
| p90 (ms) | 195.13 | 195.04 | +0.05% |
| p99 (ms) | 299.82 | 283.91 | +5.31% |
| fallbackRate | 0.24% | 0.61% | +0.37pp |

### 场景B：弱网 + 长尾

| 指标 | F2（无单候选超时） | F3（700ms 超时） | 变化 |
|---|---:|---:|---:|
| p50 (ms) | 320.80 | 321.53 | -0.23% |
| p90 (ms) | 1427.26 | 700.00 | +50.95% |
| p99 (ms) | 7184.16 | 700.00 | +90.26% |
| fallbackRate | 3.60% | 11.79% | +8.20pp |

### 结论

- **长尾已明显改善**：F3 对 `p90/p99` 的压制显著，尤其在弱网场景。
- **中位数变化不大**：`p50` 基本持平，符合“主要治理长尾”的目标。
- **代价可预期**：`fallbackRate` 上升，需要在 timeout 阈值与体验之间调参。

### 弱网阈值扫表（F3 参数建议）

> 基线（F2）弱网：`p90=1728.19ms`，`p99=60000ms`，`fallbackRate=3.47%`

| timeoutMs | p90 (ms) | p99 (ms) | p90 改善 | p99 改善 | fallbackRate | fallback 变化 |
|---:|---:|---:|---:|---:|---:|---:|
| 500 | 500 | 500 | +71.07% | +99.17% | 18.02% | +14.56pp |
| 700 | 700 | 700 | +59.50% | +98.83% | 12.25% | +8.79pp |
| 900 | 900 | 900 | +47.92% | +98.50% | 11.62% | +8.16pp |
| 1200 | 1200 | 1200 | +30.56% | +98.00% | 11.85% | +8.39pp |

建议：默认先用 `700ms`，后续按真实弱网样本再微调。

---

## 2) 真实浏览器采样环境（手工验收）

- 浏览器：
- 网络条件（推荐写明 DevTools Throttling 档位）：
- 页面数据规模（首屏图标数量）：
- 刷新次数：20（每组建议）

---

## 3) 真实浏览器一键采样脚本（Console）

### A. 初始化（只执行一次）

```js
(() => {
  localStorage.removeItem("__f3_samples_before");
  localStorage.removeItem("__f3_samples_after");
  console.log("F3 sample storage reset");
})();
```

### B. 每次刷新后采集一次（执行 20 次）

> 先采 `before`（F2 或关闭 F3），再采 `after`（当前 F3）。

```js
(() => {
  const phase = "after"; // "before" | "after"
  const key = phase === "before" ? "__f3_samples_before" : "__f3_samples_after";
  const bag = JSON.parse(localStorage.getItem(key) || "[]");

  bag.push({
    ts: Date.now(),
    favicon: window.__faviconMetricsApi?.summarize?.() ?? null,
    remote: window.__remoteResourceMetricsApi?.summarize?.() ?? null,
  });

  localStorage.setItem(key, JSON.stringify(bag));
  console.log(`[${phase}] collected ${bag.length}/20`, bag[bag.length - 1]);
})();
```

### C. 自动汇总前后改善率（执行一次）

```js
(() => {
  const before = JSON.parse(localStorage.getItem("__f3_samples_before") || "[]");
  const after = JSON.parse(localStorage.getItem("__f3_samples_after") || "[]");

  const pick = (arr, getter) => arr.map(getter).filter((v) => Number.isFinite(v) && v > 0);
  const p = (vals, pctl) => {
    if (!vals.length) return 0;
    const s = [...vals].sort((a, b) => a - b);
    const idx = Math.max(0, Math.min(s.length - 1, Math.ceil((pctl / 100) * s.length) - 1));
    return s[idx];
  };

  const bFavP90 = pick(before, (x) => x.favicon?.p90);
  const aFavP90 = pick(after, (x) => x.favicon?.p90);
  const bRemP90 = pick(before, (x) => x.remote?.p90);
  const aRemP90 = pick(after, (x) => x.remote?.p90);

  const bFavP50 = pick(before, (x) => x.favicon?.p50);
  const aFavP50 = pick(after, (x) => x.favicon?.p50);

  const bFavFallback = pick(before, (x) => x.favicon?.fallbackRate);
  const aFavFallback = pick(after, (x) => x.favicon?.fallbackRate);

  const avg = (arr) => (arr.length ? arr.reduce((s, n) => s + n, 0) / arr.length : 0);
  const improve = (beforeVal, afterVal) => (beforeVal > 0 ? (beforeVal - afterVal) / beforeVal : 0);

  const report = {
    samples: { before: before.length, after: after.length },
    favicon: {
      p50_before: p(bFavP50, 90),
      p50_after: p(aFavP50, 90),
      p50_improve: improve(p(bFavP50, 90), p(aFavP50, 90)),
      p90_before: p(bFavP90, 90),
      p90_after: p(aFavP90, 90),
      p90_improve: improve(p(bFavP90, 90), p(aFavP90, 90)),
      fallbackRate_before_avg: avg(bFavFallback),
      fallbackRate_after_avg: avg(aFavFallback),
      fallbackRate_delta: avg(aFavFallback) - avg(bFavFallback),
    },
    remote: {
      p90_before: p(bRemP90, 90),
      p90_after: p(aRemP90, 90),
      p90_improve: improve(p(bRemP90, 90), p(aRemP90, 90)),
    },
  };

  console.table({
    favicon_p90_before: report.favicon.p90_before,
    favicon_p90_after: report.favicon.p90_after,
    favicon_p90_improve: report.favicon.p90_improve,
    remote_p90_before: report.remote.p90_before,
    remote_p90_after: report.remote.p90_after,
    remote_p90_improve: report.remote.p90_improve,
    fallback_delta: report.favicon.fallbackRate_delta,
  });
  console.log("F3 report:", report);
  return report;
})();
```

---

## 4) 结果记录（真实环境）

### 优化前（Baseline）

- total:
- successCount:
- fallbackCount:
- fallbackRate:
- p50 (ms):
- p90 (ms):
- providerDistribution:

### 优化后（Current）

- total:
- successCount:
- fallbackCount:
- fallbackRate:
- p50 (ms):
- p90 (ms):
- providerDistribution:

---

## 5) 判定规则

- p90 改善率 = `(before.p90 - after.p90) / before.p90`
- p50 改善率 = `(before.p50 - after.p50) / before.p50`
- fallbackRate 变化 = `after.fallbackRate - before.fallbackRate`

建议阈值：

- **通过**：p90 改善 >= 20%，且 fallbackRate 上升可控（如 <= +5pp）
- **需调参**：p90 改善不足或 fallbackRate 上升过多
- **继续优化方向**：按 provider 质量与 `timeoutMs` 进行 A/B 微调

