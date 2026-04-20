# 空白区右键「下载壁纸」实现计划（媒体无关版）

本文档定义在空白区右键菜单新增「下载壁纸」的实现方案。  
目标是先交付可用 MVP，同时兼容后续图片/视频背景来源演进，避免返工。

---

## 1. 目标与范围

### 目标

- 在**空白区背景右键菜单**新增 `下载壁纸`。
- 点击后下载当前页面实际背景资源（优先当前来源，不写死默认图）。
- 对下载失败提供明确回退与用户提示。

### 范围（本期）

- 仅改空白区背景右键菜单，不改图标/文件夹右键菜单。
- 不新增设置项，不记录历史下载。
- 支持图片与视频背景（例如 `image/*`、`video/*`，如 mp4）。

语义约束（避免误解）：

- 本期“下载壁纸”下载的是**当前背景资源文件本身**。
- 对于视频背景，下载的是视频源文件（如 mp4/webm），**不是当前播放帧截图**。

### 非目标（本期不做）

- 不做下载任务管理器（进度条/队列/重试中心）。
- 不做云端上报必选（可选埋点/日志预留）。

---

## 2. 核心设计决策

1. 菜单文案使用短操作项：`下载壁纸`（英文：`Download Wallpaper`）。
2. 下载目标以“当前背景来源”为准，不直接依赖 `DEFAULT_NEW_TAB_BACKGROUND_URL`。
3. 如当前背景来源链路暂不可得，才 fallback 到 `DEFAULT_NEW_TAB_BACKGROUND_URL`。
4. 下载逻辑按媒体类型分流，但统一返回结构化结果，便于 UI 提示和测试。
5. 下载进行中做防重复触发（菜单项禁用或 handler 锁）。

---

## 3. 数据与接口抽象

### 3.1 背景来源抽象

```ts
type BackgroundSource =
  | { kind: "image"; url: string }
  | { kind: "video"; url: string }
  | { kind: "unknown"; url: string };

function getCurrentWallpaperSource(): BackgroundSource | null;
```

约束：

- `getCurrentWallpaperSource()` 返回当前页面“实际生效”的背景来源。
- 若返回 `null`，调用方再 fallback 到 `DEFAULT_NEW_TAB_BACKGROUND_URL` 组装 `kind: "unknown"`。

### 3.2 下载结果抽象

```ts
type DownloadWallpaperResult =
  | { ok: true; mode: "download" }
  | { ok: true; mode: "fallback-opened" }
  | { ok: false; reason: "popup-blocked" | "invalid-url" | "fetch-failed" | "unknown" };
```

说明：

- 浏览器环境下 `fetch` 失败常表现为通用错误（如 `TypeError`），不保证能精准区分 network/cors/dns/mixed-content。
- 本期统一收敛为 `fetch-failed`，后续若具备稳定识别能力再细分。

---

## 4. 下载流程（推荐）

新增：

```ts
downloadWallpaper(source: BackgroundSource): Promise<DownloadWallpaperResult>
```

流程：

1. 校验 URL（无效 URL -> `invalid-url`）。
2. 主流程：`fetch(url)` -> `blob` -> `URL.createObjectURL` -> `<a download>` 触发下载。
3. 扩展名推断：
   - 优先 `Content-Type`（`image/jpeg/png/webp`、`video/mp4/webm` 等）
   - 次选 URL pathname 后缀
   - 最后按 `kind` 兜底默认扩展名：
     - `image` -> `.jpg`
     - `video` -> `.mp4`
     - `unknown` -> `.bin`
4. 文件名规范：
   - `xallor-background-YYYYMMDD-HHmmss.ext`
   - 其中 `ext` 来自第 3 步推断结果。
5. `fetch` 失败（统一 `fetch-failed`）时 fallback：
   - 尝试 `window.open(url, "_blank", "noopener,noreferrer")`
   - 打开成功 -> `fallback-opened`
   - 打开失败（可能被拦截）-> `popup-blocked`
6. 未命中的异常归 `unknown`。

---

## 5. 交互与反馈

### 5.1 菜单行为

- 空白区右键菜单显示 `下载壁纸`。
- 图标/文件夹右键菜单不显示该项。
- 点击后立即关闭菜单并进入下载流程。
- 菜单关闭不依赖下载结果；下载在菜单关闭后异步执行，避免菜单 UI 卡顿。

### 5.2 防重复触发

- 下载进行中：禁用该菜单项（或 handler 内单飞锁）。
- 下载结束后恢复可点击状态。

### 5.3 用户提示

- `download`：`壁纸已开始下载`
- `fallback-opened`：`自动下载失败，已打开原图，可手动保存`
- `popup-blocked`：`自动下载失败，浏览器拦截了新窗口，请允许弹窗后重试`
- 其他失败：`下载失败，请稍后重试`

提示层建议复用应用内 `GlassMessageDialog` 或轻提示组件，避免系统弹窗风格割裂。

---

## 6. 测试计划（必须）

### 单元测试

- 背景菜单包含 `download-wallpaper` 条目。
- 图标/文件夹菜单不包含 `download-wallpaper`。
- 下载函数覆盖分支：
  - 成功下载 `download`
  - 回退打开 `fallback-opened`
  - 弹窗拦截 `popup-blocked`
  - `invalid-url` / `unknown`

### E2E 测试

- 右击空白区可见 `下载壁纸`。
- 右击图标/文件夹不可见 `下载壁纸`（负向断言）。
- 不影响已有菜单项与整理模式行为（防回归）。

---

## 7. 可观测性（建议）

- 开发期至少保留 debug log（成功、fallback、失败 reason）。
- 若项目已有埋点体系，可预留事件：
  - `wallpaper_download_success`
  - `wallpaper_download_fallback_opened`
  - `wallpaper_download_failed`（附 reason）

---

## 8. 分阶段实施

1. 菜单项接入 + i18n 文案。
2. `getCurrentWallpaperSource()` 抽象与 fallback 链路。
3. `downloadWallpaper()` 与结果类型实现。
4. UI 反馈 + 防重入。
5. 单测/E2E（含负向用例）补齐。

---

## 9. 一句话决策

> 以“当前实际背景来源”为下载目标，统一返回结构化下载结果，兼容图片/视频背景与失败回退路径，在不污染实体右键菜单的前提下交付稳定可扩展的下载能力。

