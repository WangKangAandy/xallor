/**
 * Build-time i18n checks (CI):
 * 1) Locale coverage: ZH_CN / EN_US 的 key 集合必须完全一致
 * 2) Missing key：任一侧多出的 key（与上一条等价，单独列出便于阅读）
 * 3) Unused key：除 messages.ts 外，源码中未出现带引号的 key 字面量（预留 ALLOW_UNUSED_I18N_KEYS）
 *
 * 依赖 TypeScript 解析 `messages.ts` 对象字面量，避免手写正则误报。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const messagesPath = path.join(root, "src/app/i18n/messages.ts");

function unwrapToObjectLiteral(node) {
  let n = node;
  while (
    n &&
    (ts.isParenthesizedExpression(n) ||
      ts.isAsExpression(n) ||
      ts.isTypeAssertionExpression(n))
  ) {
    n = n.expression;
  }
  if (n && ts.isSatisfiesExpression(n)) {
    n = n.expression;
  }
  return ts.isObjectLiteralExpression(n) ? n : null;
}

function collectStringLiteralKeys(objectLiteral) {
  const keys = [];
  for (const prop of objectLiteral.properties) {
    if (!ts.isPropertyAssignment(prop) || !prop.name) continue;
    if (ts.isStringLiteral(prop.name)) {
      keys.push(prop.name.text);
    }
  }
  return keys;
}

function getVariableObjectKeys(sourceText, fileName, varName) {
  const sf = ts.createSourceFile(fileName, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  let found = [];

  function visit(node) {
    if (ts.isVariableDeclaration(node) && node.name && ts.isIdentifier(node.name) && node.name.text === varName) {
      const ol = unwrapToObjectLiteral(node.initializer);
      if (ol) {
        found = collectStringLiteralKeys(ol);
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sf);
  return found;
}

function walkTsFiles(dir, out, skipDirNames) {
  const names = fs.readdirSync(dir, { withFileTypes: true });
  for (const ent of names) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (skipDirNames.has(ent.name)) continue;
      walkTsFiles(p, out, skipDirNames);
    } else if (/\.(ts|tsx|mts|cts)$/.test(ent.name) && !ent.name.endsWith(".d.ts")) {
      out.push(p);
    }
  }
}

function main() {
  const sourceText = fs.readFileSync(messagesPath, "utf8");
  const zhKeys = getVariableObjectKeys(sourceText, "messages.ts", "ZH_CN");
  const enKeys = getVariableObjectKeys(sourceText, "messages.ts", "EN_US");

  const setZh = new Set(zhKeys);
  const setEn = new Set(enKeys);

  const onlyZh = [...setZh].filter((k) => !setEn.has(k)).sort();
  const onlyEn = [...setEn].filter((k) => !setZh.has(k)).sort();

  const allowUnused = new Set(
    (process.env.ALLOW_UNUSED_I18N_KEYS ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );

  const scanRoots = [path.join(root, "src"), path.join(root, "e2e")].filter((p) => fs.existsSync(p));
  const skipDirs = new Set(["node_modules", "dist", ".git"]);
  const files = [];
  for (const r of scanRoots) {
    walkTsFiles(r, files, skipDirs);
  }

  const messagesNorm = path.normalize(messagesPath);
  const scanFiles = files.filter((f) => path.normalize(f) !== messagesNorm);

  const combined = scanFiles
    .map((f) => {
      try {
        return fs.readFileSync(f, "utf8");
      } catch {
        return "";
      }
    })
    .join("\n");

  /** `t("…")` / `t('…')` 静态首参（与 TS 的 MessageKey 互补，防漏加词条） */
  const referencedByT = new Set();
  for (const f of scanFiles) {
    const text = fs.readFileSync(f, "utf8");
    const tCallRe = /\bt\s*\(\s*["']([^"']+)["']/g;
    let m;
    while ((m = tCallRe.exec(text)) !== null) {
      referencedByT.add(m[1]);
    }
  }
  const missingInDict = [...referencedByT].filter((k) => !setZh.has(k)).sort();

  const canonicalKeys = [...setZh].sort();
  if (setZh.size !== setEn.size || onlyZh.length || onlyEn.length) {
    console.error("[i18n] Locale coverage failed: ZH_CN and EN_US keys must match.");
    if (onlyZh.length) console.error("  Only in ZH_CN:", onlyZh.join(", "));
    if (onlyEn.length) console.error("  Only in EN_US:", onlyEn.join(", "));
    process.exitCode = 1;
  }

  if (missingInDict.length) {
    console.error("[i18n] t(\"…\") references missing from messages.ts (add to ZH_CN / EN_US):");
    for (const k of missingInDict) {
      console.error(`  - ${k}`);
    }
    process.exitCode = 1;
  }

  const unused = [];
  for (const key of canonicalKeys) {
    if (allowUnused.has(key)) continue;
    const inDouble = combined.includes(`"${key}"`);
    const inSingle = combined.includes(`'${key}'`);
    if (!inDouble && !inSingle) {
      unused.push(key);
    }
  }

  if (unused.length) {
    console.error(
      "[i18n] Unused MessageKey(s) (not found as quoted literal outside messages.ts; fix references or add to ALLOW_UNUSED_I18N_KEYS):",
    );
    for (const k of unused) {
      console.error(`  - ${k}`);
    }
    process.exitCode = 1;
  }

  if (!process.exitCode) {
    console.log(
      `[i18n] OK: ${canonicalKeys.length} keys, locale parity, no unused keys (scanned ${scanFiles.length} files).`,
    );
  }
}

main();
