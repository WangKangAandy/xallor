/**
 * 本地诊断：极简 + Dock 常驻 + 打开设置「外观」时，采集浏览器 console / 异常并探测 Dock 相关 DOM。
 * 用法：先启动 dev（默认期望 http://localhost:4173，与 playwright.config 一致），再执行：
 *   node scripts/dock-settings-console-probe.mjs
 * 可选环境变量：
 *   BASE_URL=http://localhost:5174   端口与手动 dev 一致时
 *   DOCK_SITES=0|1   1=写入两条站点（默认），0=清空 Dock 条目仅保留「+」
 */
import { chromium } from "playwright";

const baseURL = process.env.BASE_URL?.replace(/\/$/, "") || "http://localhost:4173";
const withSites = process.env.DOCK_SITES !== "0";

const DOCK_STORAGE_JSON = JSON.stringify({
  version: 1,
  entries: [
    {
      kind: "site",
      id: "probe-dock-a",
      site: { name: "ProbeA", domain: "a.probe.test", url: "https://a.probe.test/" },
    },
    {
      kind: "site",
      id: "probe-dock-b",
      site: { name: "ProbeB", domain: "b.probe.test", url: "https://b.probe.test/" },
    },
  ],
});

const EMPTY_DOCK_JSON = JSON.stringify({ version: 1, entries: [] });

async function main() {
  const events = [];
  const log = (kind, detail) => {
    const line = `[${kind}] ${typeof detail === "string" ? detail : JSON.stringify(detail)}`;
    events.push(line);
    console.error(line);
  };

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on("console", (msg) => {
    log(`console.${msg.type()}`, msg.text());
  });
  page.on("pageerror", (err) => {
    log("pageerror", String(err?.stack || err));
  });
  page.on("requestfailed", (req) => {
    log("requestfailed", `${req.method()} ${req.url()} — ${req.failure()?.errorText ?? "?"}`);
  });

  const dockJson = withSites ? DOCK_STORAGE_JSON : EMPTY_DOCK_JSON;

  await page.goto(baseURL, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.evaluate(
    ([dock]) => {
      globalThis.localStorage.setItem("xallor_device_id", "probe-dock-settings");
      globalThis.localStorage.setItem("xallor_ui_layout", "minimal");
      globalThis.localStorage.setItem("xallor_ui_minimal_dock_mode", "pinned");
      globalThis.localStorage.setItem("xallor_minimal_dock_v1", dock);
    },
    [dockJson],
  );
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(800);

  const afterLoad = await page.evaluate(() => {
    const q = (sel) => !!document.querySelector(sel);
    const dockShell = document.querySelector('[data-testid="minimal-dock-shell"]');
    let zWalk = null;
    let el = dockShell;
    while (el && el !== document.body) {
      const zi = globalThis.getComputedStyle(el).zIndex;
      if (zi && zi !== "auto") {
        zWalk = zi;
        break;
      }
      el = el.parentElement;
    }
    return {
      minimal_dock_shell: q('[data-testid="minimal-dock-shell"]'),
      minimal_dock_bar: q('[data-testid="minimal-dock-bar"]'),
      minimal_dock_capsule: q('[data-testid="minimal-dock-capsule"]'),
      minimal_dock_add_outer: q('[data-testid="minimal-dock-add-outer"]'),
      dock_ancestor_zIndex: zWalk,
    };
  });
  log("DOM.after_seed_reload", afterLoad);

  await page.getByTestId("sidebar-hover-zone").hover();
  const settingsBtn = page.locator('[data-testid="sidebar-hover-zone"] button').last();
  await settingsBtn.click({ timeout: 15_000 });
  await page.getByTestId("settings-modal-close").waitFor({ state: "visible", timeout: 15_000 });
  await page.getByTestId("settings-nav-appearance").click();
  await page.getByTestId("settings-minimal-dock-mode-pinned").waitFor({ state: "visible", timeout: 15_000 });
  await page.waitForTimeout(400);

  const afterSettings = await page.evaluate(() => {
    const q = (sel) => !!document.querySelector(sel);
    const capsule = document.querySelector('[data-testid="minimal-dock-capsule"]');
    const bar = document.querySelector('[data-testid="minimal-dock-bar"]');
    const add = document.querySelector('[data-testid="minimal-dock-add-outer"]');
    const vis = (el) => {
      if (!el) return null;
      const s = globalThis.getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return {
        display: s.display,
        visibility: s.visibility,
        opacity: s.opacity,
        rect: { x: r.x, y: r.y, w: r.width, h: r.height },
      };
    };
    return {
      minimal_dock_shell: q('[data-testid="minimal-dock-shell"]'),
      minimal_dock_bar: q('[data-testid="minimal-dock-bar"]'),
      minimal_dock_capsule: q('[data-testid="minimal-dock-capsule"]'),
      minimal_dock_add_outer: q('[data-testid="minimal-dock-add-outer"]'),
      capsule_visibility: vis(capsule),
      bar_visibility: vis(bar),
      add_visibility: vis(add),
      dialog_open: !!document.querySelector('[role="dialog"]'),
    };
  });
  log("DOM.after_settings_appearance", afterSettings);

  await browser.close();

  console.error("\n--- summary ---");
  console.error(`BASE_URL=${baseURL} DOCK_SITES=${withSites ? "1" : "0"}`);
  console.error(`console/pageerror/request events: ${events.length}`);
  if (!afterSettings.minimal_dock_bar) {
    console.error("RESULT: minimal-dock-bar 未挂载 — Dock 层可能未渲染或 layout/dock 模式不符。");
    process.exitCode = 2;
  } else if (withSites && !afterSettings.minimal_dock_capsule) {
    console.error("RESULT: 已写入站点但无 minimal-dock-capsule — 与 MinimalDockBar 分支逻辑不符，需查 entries 同步。");
    process.exitCode = 3;
  } else if (!withSites && !afterSettings.minimal_dock_add_outer) {
    console.error("RESULT: 空 Dock 时应出现 minimal-dock-add-outer。");
    process.exitCode = 4;
  } else {
    console.error("RESULT: Dock 相关 DOM 符合预期（请结合上方 visibility rect 判断是否被遮挡/尺寸为 0）。");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
