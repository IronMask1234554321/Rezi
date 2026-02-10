import { execFileSync, spawnSync } from "node:child_process";
import { copyFileSync, existsSync } from "node:fs";
import { delimiter, join } from "node:path";

function spawnNpm(args, options) {
  // Prefer the npm CLI path provided by npm itself when running under `npm run`.
  // This avoids shell differences on Windows (cmd.exe vs bash) and PATH issues.
  const npmExecPath = process.env.npm_execpath;
  if (npmExecPath && existsSync(npmExecPath)) {
    return spawnSync(process.execPath, [npmExecPath, ...args], options);
  }

  const candidates = process.platform === "win32" ? ["npm", "npm.cmd"] : ["npm"];
  let last = null;
  for (const cmd of candidates) {
    const res = spawnSync(cmd, args, options);
    last = res;
    if (!res.error) return res;
  }
  return last;
}

function canRunCargo(env) {
  try {
    execFileSync("cargo", ["--version"], { stdio: "ignore", env });
    return true;
  } catch {
    return false;
  }
}

function getCargoExePath(env) {
  const cargoHome =
    typeof env.CARGO_HOME === "string" && env.CARGO_HOME.length > 0
      ? env.CARGO_HOME
      : typeof env.USERPROFILE === "string" && env.USERPROFILE.length > 0
        ? join(env.USERPROFILE, ".cargo")
        : null;
  if (!cargoHome) return null;
  const cargoBin = join(cargoHome, "bin");
  const cargoExe =
    process.platform === "win32" ? join(cargoBin, "cargo.exe") : join(cargoBin, "cargo");
  return existsSync(cargoExe) ? cargoExe : null;
}

function ensureCargoOnPath(env) {
  if (canRunCargo(env)) return env;

  const cargoExe = getCargoExePath(env);
  if (!cargoExe) {
    const hint =
      process.platform === "win32"
        ? [
            "@rezi-ui/native: cargo not found (Rust toolchain missing).",
            "",
            "Install Rust (includes cargo) via rustup: https://rustup.rs/",
            "Then reopen your terminal and verify:",
            "  cargo --version",
            "  rustc --version",
          ].join("\n")
        : [
            "@rezi-ui/native: cargo not found (Rust toolchain missing).",
            "",
            "Install Rust via rustup: https://rustup.rs/",
            "Then verify: cargo --version",
          ].join("\n");
    process.stderr.write(`${hint}\n`);
    process.exit(1);
  }

  const next = { ...env };
  const cargoBin = join(cargoExe, "..");
  const currentPath = typeof next.PATH === "string" ? next.PATH : "";
  next.PATH = `${cargoBin}${delimiter}${currentPath}`;
  if (canRunCargo(next)) return next;

  process.stderr.write(
    `${[
      "@rezi-ui/native: cargo exists on disk but still isn't runnable from this npm script environment.",
      "",
      `Found cargo at: ${cargoExe}`,
      "",
      "Try running the build from a fresh terminal, or set PATH so it includes your Rust bin directory.",
      "On Windows with rustup, that's usually:",
      `  ${join(String(env.USERPROFILE ?? "C:\\Users\\<you>"), ".cargo", "bin")}`,
    ].join("\n")}\n`,
  );
  process.exit(1);
}

function withRustToolchainOnPath(env) {
  const next = { ...env };
  const currentPath = typeof next.PATH === "string" ? next.PATH : "";

  // When npm is configured to run scripts via Git Bash on Windows, PATH may not
  // include the Rust toolchain even if it exists on disk. The napi CLI shells
  // out to `cargo`, so ensure it's discoverable.
  const cargoHome =
    typeof next.CARGO_HOME === "string" && next.CARGO_HOME.length > 0
      ? next.CARGO_HOME
      : typeof next.USERPROFILE === "string" && next.USERPROFILE.length > 0
        ? join(next.USERPROFILE, ".cargo")
        : null;

  if (cargoHome) {
    const cargoBin = join(cargoHome, "bin");
    const cargoExe =
      process.platform === "win32" ? join(cargoBin, "cargo.exe") : join(cargoBin, "cargo");
    if (existsSync(cargoExe) && !currentPath.toLowerCase().includes(cargoBin.toLowerCase())) {
      next.PATH = `${cargoBin}${delimiter}${currentPath}`;
    }
  }

  // Ensure `napi` can find cargo even if it shells out through cmd.exe with a
  // different PATH resolution behavior.
  if (typeof next.CARGO !== "string" || next.CARGO.length === 0) {
    const cargoExe = getCargoExePath(next);
    if (cargoExe) next.CARGO = cargoExe;
  }

  return next;
}

function buildWithCargoDirectly(env, host) {
  const cargoExe = getCargoExePath(env) ?? "cargo";
  try {
    execFileSync(cargoExe, ["build", "--release", "--target", host], { stdio: "inherit", env });
  } catch (err) {
    if (process.platform === "win32") {
      process.stderr.write(
        `${[
          "",
          "@rezi-ui/native: cargo build failed on Windows.",
          "If you see linker errors like `LNK1104: cannot open file 'msvcrt.lib'` or missing headers like `stdint.h`,",
          "install Visual Studio Build Tools (MSVC v143 + Windows 10/11 SDK) and run the build from a VS Developer shell.",
          "",
        ].join("\n")}\n`,
      );
    }
    throw err;
  }

  const crateName = "rezi_ui_native";
  const targetDir = join(process.cwd(), "target", host, "release");
  const built =
    process.platform === "win32"
      ? join(targetDir, `${crateName}.dll`)
      : process.platform === "darwin"
        ? join(targetDir, `lib${crateName}.dylib`)
        : join(targetDir, `lib${crateName}.so`);

  if (!existsSync(built)) {
    throw new Error(`@rezi-ui/native: cargo build succeeded but output was not found: ${built}`);
  }

  // Node loads addons as .node (they are native shared libraries under the hood).
  // Keep both filenames as candidates for the JS loader.
  copyFileSync(built, join(process.cwd(), "rezi_ui_native.node"));
  copyFileSync(built, join(process.cwd(), "index.node"));
}

function getHostTargetTriple() {
  let out;
  try {
    out = execFileSync("rustc", ["-vV"], { encoding: "utf8" });
  } catch (err) {
    const hint =
      process.platform === "win32"
        ? "Install Rust from https://rustup.rs/ (or ensure `rustc.exe` is on PATH)."
        : "Install Rust via rustup (https://rustup.rs/) and ensure `rustc` is on PATH.";
    const detail = err instanceof Error ? err.message : String(err);
    throw new Error(`@rezi-ui/native: rustc not found or not runnable.\n${hint}\n\n${detail}`);
  }
  const line = out
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l.startsWith("host: "));
  if (!line) throw new Error("Failed to determine Rust host triple from `rustc -vV`");
  return line.slice("host: ".length).trim();
}

let host;
try {
  host = getHostTargetTriple();
} catch (err) {
  process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
}

const scriptEnv = ensureCargoOnPath(withRustToolchainOnPath(process.env));

// @napi-rs/cli parses Cargo.toml by running `cargo metadata` through cmd.exe on Windows.
// Some environments can run `cargo` fine from PowerShell, but cmd.exe fails to resolve it.
// Use a direct cargo build path on Windows to avoid that failure mode.
if (process.platform === "win32") {
  try {
    buildWithCargoDirectly(scriptEnv, host);
  } catch (err) {
    process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
    process.exit(1);
  }
} else {
  const res = spawnNpm(
    ["exec", "--", "napi", "build", "--platform", "--release", "--target", host, "--js", "false"],
    {
      stdio: "inherit",
      env: scriptEnv,
    },
  );

  if (res?.error) {
    const detail = res.error instanceof Error ? res.error.message : String(res.error);
    process.stderr.write(`@rezi-ui/native: failed to invoke npm.\n\n${detail}\n`);
    process.exit(1);
  }

  if (res.status !== 0) {
    process.exit(res.status ?? 1);
  }
}

if (existsSync("./index.d.ts")) {
  const fmt = spawnNpm(["exec", "--", "biome", "format", "index.d.ts", "--write"], {
    stdio: "inherit",
    env: scriptEnv,
  });
  if (fmt?.error) {
    const detail = fmt.error instanceof Error ? fmt.error.message : String(fmt.error);
    process.stderr.write(
      `@rezi-ui/native: warning: failed to invoke npm for formatting index.d.ts (continuing).\n\n${detail}\n`,
    );
  }
  if (fmt.status !== 0) {
    process.stderr.write(
      `@rezi-ui/native: warning: biome format returned non-zero status (${fmt.status ?? "unknown"}); continuing.\n`,
    );
  }
}
