#!/usr/bin/env node
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));

function die(msg) {
  process.stderr.write(`${msg}\n`);
  process.exit(1);
}

function readJson(path) {
  const raw = readFileSync(path, "utf8");
  try {
    return JSON.parse(raw);
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    die(`verify-native-pack: failed to parse JSON: ${path}\n${detail}`);
  }
}

function parseArgs(argv) {
  const args = { pkgDir: join(ROOT, "packages", "native"), hostOnly: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--pkg") {
      const v = argv[i + 1];
      if (typeof v !== "string" || v.length === 0)
        die("verify-native-pack: --pkg requires a value");
      args.pkgDir = resolve(ROOT, v);
      i++;
      continue;
    }
    if (a === "--host-only") {
      args.hostOnly = true;
      continue;
    }
    die(`verify-native-pack: unknown arg: ${a}`);
  }
  return args;
}

function resolveHostSuffix() {
  if (process.platform === "linux") {
    if (process.arch !== "x64" && process.arch !== "arm64") return null;
    // Locked by docs/backend/native.md: we ship glibc (gnu) only.
    // Treat Alpine/musl as unsupported for the host-only check.
    if (existsSync("/etc/alpine-release")) return null;
    return `linux-${process.arch}-gnu`;
  }
  if (process.platform === "darwin") {
    if (process.arch !== "x64" && process.arch !== "arm64") return null;
    return `darwin-${process.arch}`;
  }
  if (process.platform === "win32") {
    if (process.arch !== "x64" && process.arch !== "arm64") return null;
    return `win32-${process.arch}-msvc`;
  }
  return null;
}

function listTarEntries(tgzPath) {
  try {
    const out = execFileSync("tar", ["-tf", tgzPath], { encoding: "utf8" });
    return out
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    die(`verify-native-pack: failed to list tar entries via 'tar -tf'.\n${detail}`);
  }
}

function run(cmd, args, cwd) {
  const res = spawnSync(cmd, args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    shell: process.platform === "win32",
  });
  if (res.status !== 0) {
    die(
      [
        `verify-native-pack: command failed: ${cmd} ${args.join(" ")}`,
        `cwd: ${cwd}`,
        res.stdout?.trim() ? `stdout:\n${res.stdout.trim()}` : "",
        res.stderr?.trim() ? `stderr:\n${res.stderr.trim()}` : "",
      ]
        .filter((l) => l.length > 0)
        .join("\n\n"),
    );
  }
  return (res.stdout ?? "").trim();
}

const { pkgDir, hostOnly } = parseArgs(process.argv);
const pkgJsonPath = join(pkgDir, "package.json");
if (!existsSync(pkgJsonPath)) die(`verify-native-pack: missing ${pkgJsonPath}`);

const pkgJson = readJson(pkgJsonPath);
const napiName = pkgJson?.napi?.name;
if (typeof napiName !== "string" || napiName.length === 0) {
  die(`verify-native-pack: ${pkgJsonPath} missing napi.name`);
}

const requiredSuffixesAll = [
  // docs/backend/native.md (locked platform list)
  "win32-x64-msvc",
  "win32-arm64-msvc",
  "darwin-x64",
  "darwin-arm64",
  "linux-x64-gnu",
  "linux-arm64-gnu",
];

let requiredSuffixes = requiredSuffixesAll;
if (hostOnly) {
  const host = resolveHostSuffix();
  if (host === null)
    die(`verify-native-pack: unsupported host: ${process.platform} ${process.arch}`);
  requiredSuffixes = [host];
}

const requiredBinaries = requiredSuffixes.map((s) => `${napiName}.${s}.node`);

const missingOnDisk = requiredBinaries.filter((f) => !existsSync(join(pkgDir, f)));
if (missingOnDisk.length > 0) {
  die(
    [
      "verify-native-pack: missing expected prebuilt binaries on disk.",
      `pkg: ${pkgDir}`,
      ...missingOnDisk.map((f) => `- ${f}`),
    ].join("\n"),
  );
}

process.stdout.write(
  `verify-native-pack: found ${requiredBinaries.length} expected .node files in ${pkgDir}\n`,
);

const packOut = run("npm", ["pack", "--silent"], pkgDir);
const packLines = packOut
  .split("\n")
  .map((l) => l.trim())
  .filter((l) => l.length > 0);
if (packLines.length === 0) die("verify-native-pack: npm pack produced no output");
const tgzName = packLines[packLines.length - 1];
const tgzPath = resolve(pkgDir, tgzName);
if (!existsSync(tgzPath)) die(`verify-native-pack: expected tarball missing: ${tgzPath}`);

process.stdout.write(`verify-native-pack: created ${basename(tgzPath)}\n`);

const entries = listTarEntries(tgzPath);
const expectedEntrySet = new Set(requiredBinaries.map((f) => `package/${f}`));
const missingInTar = [...expectedEntrySet].filter((e) => !entries.includes(e));
if (missingInTar.length > 0) {
  die(
    [
      "verify-native-pack: tarball missing expected binaries.",
      `tarball: ${tgzPath}`,
      ...missingInTar.map((e) => `- ${e}`),
    ].join("\n"),
  );
}

const unexpectedNodes = entries
  .filter((e) => e.startsWith("package/") && e.endsWith(".node"))
  .filter((e) => e.startsWith(`package/${napiName}.`))
  .filter((e) => !expectedEntrySet.has(e));

if (unexpectedNodes.length > 0) {
  die(
    [
      "verify-native-pack: tarball contains unexpected .node binaries (expected names are fixed).",
      `tarball: ${tgzPath}`,
      ...unexpectedNodes.map((e) => `- ${e}`),
    ].join("\n"),
  );
}

process.stdout.write("verify-native-pack: tarball contains expected native binaries\n");

// Install into a temp workspace and smoke-test loading + create/destroy.
const tmpRoot = mkdtempSync(join(tmpdir(), "rezi-native-pack-"));
mkdirSync(tmpRoot, { recursive: true });
writeFileSync(
  join(tmpRoot, "package.json"),
  JSON.stringify({ name: "rezi-native-pack-smoke", private: true, type: "module" }, null, 2),
);

run("npm", ["install", "--silent", "--no-fund", "--no-audit", tgzPath], tmpRoot);

const smokePath = join(tmpRoot, "smoke.mjs");
writeFileSync(
  smokePath,
  [
    'import { engineCreate, engineDestroy } from "@rezi-ui/native";',
    "",
    "const ZR_ERR_PLATFORM = -6;",
    "",
    "const id = engineCreate({});",
    'if (typeof id !== "number") throw new Error(`engineCreate must return a number, got: ${typeof id}`);',
    "if (id === ZR_ERR_PLATFORM && !(process.stdout.isTTY && process.stdin.isTTY)) {",
    '  process.stdout.write("native-pack-smoke: SKIP engineCreate() (no TTY / platform init unavailable)\\n");',
    "  process.exit(0);",
    "}",
    "if (!(id > 0)) throw new Error(`engineCreate must return a non-zero engineId, got: ${id}`);",
    "engineDestroy(id);",
    "engineDestroy(id); // idempotent",
    'process.stdout.write("native-pack-smoke: OK\\n");',
  ].join("\n"),
);

run("node", [smokePath], tmpRoot);

// Best-effort cleanup (CI temp dirs are ephemeral, but keep local tidy).
try {
  rmSync(tmpRoot, { recursive: true, force: true });
} catch {
  // ignore
}

process.stdout.write("verify-native-pack: OK\n");
