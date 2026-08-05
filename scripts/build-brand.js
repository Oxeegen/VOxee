#!/usr/bin/env node
/**
 * Branded, unsigned, slimmed Windows build.
 *
 * MUST run on a native Windows host (C:\ path), not a WSL/UNC mount: native
 * modules (better-sqlite3) and the bundler binaries (rolldown/esbuild) do not
 * load over UNC.
 *
 * The slim prebuild (Windows helpers only) runs automatically as the npm
 * pre-hook of `build:win:brand` (prebuild:win:brand), so this script does not
 * re-run it. Invoke via `npm run build:win:brand` (not `node` directly).
 *
 * Steps:
 *   1. Bake brand/config/buildFlags.json (debug flag) — restored afterwards.
 *   2. Renderer build.
 *   3. Physically stash resources/bin/ model binaries (keep only Windows
 *      helpers) so electron-builder cannot bundle them — see FORK piege #1
 *      (extends concatenates extraResources; a filter override cannot remove
 *      them). Restored afterwards.
 *   4. electron-builder with electron-builder.brand.json (unsigned).
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const BUILD_FLAGS = path.join(ROOT, "brand", "config", "buildFlags.json");
const BRAND_ICON = path.join(ROOT, "brand", "assets", "voxee.ico");
const RES_BIN = path.join(ROOT, "resources", "bin");
const STASH = path.join(ROOT, ".brand-bin-stash");

const args = process.argv.slice(2);
const debug = args.includes("--debug");

// Keep Windows runtime helpers + yt-dlp (URL/YouTube upload) in resources/bin
// during packaging; everything else (model runtimes) is stashed out.
const KEEP = /^(windows-|yt-dlp|nircmd\.exe$)/i;

function run(cmd, extraEnv) {
  console.log(`\n▶ ${cmd}`);
  execSync(cmd, { cwd: ROOT, stdio: "inherit", env: { ...process.env, ...extraEnv } });
}

function bakeBuildFlags() {
  const original = fs.readFileSync(BUILD_FLAGS, "utf8");
  fs.writeFileSync(BUILD_FLAGS, `${JSON.stringify({ debug }, null, 2)}\n`);
  console.log(`Baked buildFlags.debug = ${debug}`);
  return () => fs.writeFileSync(BUILD_FLAGS, original);
}

function stashModelBinaries() {
  if (!fs.existsSync(RES_BIN)) return () => {};
  fs.mkdirSync(STASH, { recursive: true });
  const moved = [];
  for (const entry of fs.readdirSync(RES_BIN)) {
    if (KEEP.test(entry)) continue;
    const from = path.join(RES_BIN, entry);
    const to = path.join(STASH, entry);
    fs.renameSync(from, to);
    moved.push(entry);
  }
  if (moved.length) console.log(`Stashed ${moved.length} non-Windows entries from resources/bin`);
  return () => {
    for (const entry of moved) {
      fs.renameSync(path.join(STASH, entry), path.join(RES_BIN, entry));
    }
    try {
      fs.rmdirSync(STASH);
    } catch {
      // may be non-empty if a restore failed — leave it for inspection
    }
  };
}

function main() {
  if (!fs.existsSync(BRAND_ICON)) {
    console.error(
      `\n✖ Missing brand icon: ${BRAND_ICON}\n  Drop voxee.ico (and voxee.png) into brand/assets/ before building.\n`
    );
    process.exit(1);
  }

  const restoreFlags = bakeBuildFlags();
  let restoreBin = () => {};
  try {
    run("npm run build:renderer");
    restoreBin = stashModelBinaries();
    run("npx electron-builder -c electron-builder.brand.json --win", {
      CSC_IDENTITY_AUTO_DISCOVERY: "false",
    });
  } finally {
    restoreBin();
    restoreFlags();
  }
  console.log("\n✓ Branded Windows build complete (dist/).");
}

main();
