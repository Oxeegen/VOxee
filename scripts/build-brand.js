#!/usr/bin/env node
/**
 * Branded, unsigned, slimmed build. Target platform is the first CLI arg
 * (`win` | `linux`, default `win`) — see `build:win:brand` / `build:linux:brand`.
 *
 * MUST run on a native host of the target OS (e.g. Windows on a C:\ path, not a
 * WSL/UNC mount): native modules (better-sqlite3) and the bundler binaries
 * (rolldown/esbuild) do not load over UNC / cross-platform.
 *
 * The slim prebuild (target-OS helpers only) runs automatically as the npm
 * pre-hook (prebuild:<target>:brand), so this script does not re-run it. Invoke
 * via `npm run build:<target>:brand` (not `node` directly).
 *
 * Steps:
 *   1. Bake brand/config/buildFlags.json (debug flag) — restored afterwards.
 *   2. Renderer build.
 *   3. Physically stash resources/bin/ model binaries (keep only the target
 *      OS's helpers) so electron-builder cannot bundle them — see FORK piege #1
 *      (extends concatenates extraResources; a filter override cannot remove
 *      them). Restored afterwards.
 *   4. electron-builder with electron-builder.brand.json (unsigned).
 *
 * CI knobs (env vars, both optional):
 *   - BRAND_VERSION: overrides the packaged app version (extraMetadata.version),
 *     e.g. derived from a `voxee-vX.Y.Z` release tag.
 *   - BRAND_PUBLISH: electron-builder --publish value (never|onTag|always).
 *     Defaults to "never" so a local build never publishes, even though
 *     electron-builder.brand.json now points `publish` at the fork's repo.
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const BUILD_FLAGS = path.join(ROOT, "brand", "config", "buildFlags.json");
const RES_BIN = path.join(ROOT, "resources", "bin");
const STASH = path.join(ROOT, ".brand-bin-stash");

const args = process.argv.slice(2);
const debug = args.includes("--debug");

// Per-target packaging: electron-builder flag, brand icon, and which
// resources/bin entries to keep (target-OS helpers + yt-dlp for URL/YouTube
// upload); everything else (model runtimes) is stashed out.
const TARGETS = {
  win: { ebFlag: "--win", icon: "voxee.ico", keep: /^(windows-|yt-dlp|nircmd\.exe$)/i },
  linux: { ebFlag: "--linux AppImage", icon: "voxee.png", keep: /^(linux-|yt-dlp)/i },
};
const target = Object.keys(TARGETS).find((t) => args.includes(t)) || "win";
const targetCfg = TARGETS[target];
const BRAND_ICON = path.join(ROOT, "brand", "assets", targetCfg.icon);

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
    if (targetCfg.keep.test(entry)) continue;
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
    const version = process.env.BRAND_VERSION;
    const publish = process.env.BRAND_PUBLISH || "never";
    let ebCmd = `npx electron-builder -c electron-builder.brand.json ${targetCfg.ebFlag}`;
    if (version) ebCmd += ` -c.extraMetadata.version=${version}`;
    ebCmd += ` --publish ${publish}`;
    run(ebCmd, {
      CSC_IDENTITY_AUTO_DISCOVERY: "false",
    });
  } finally {
    restoreBin();
    restoreFlags();
  }
  console.log(`\n✓ Branded ${target} build complete (dist/).`);
}

main();
