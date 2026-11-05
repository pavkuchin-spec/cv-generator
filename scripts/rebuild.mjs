#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { resolveWorkspace } from "./lib/workspace.mjs";
import { parseRebuildArgs, REBUILD_USAGE } from "./lib/rebuild-options.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { workspaceDir, variantsDir, args } = resolveWorkspace({ root });

function slugFromPath(candidate) {
  const normalized = path.resolve(candidate).split(path.sep);
  const index = normalized.lastIndexOf("variants");
  return index >= 0 && normalized[index + 1] ? normalized[index + 1] : null;
}

function inferSlug(candidate) {
  if (candidate) {
    const direct = path.join(variantsDir, candidate);
    if (fs.existsSync(direct)) return candidate;
    const fromPath = slugFromPath(candidate);
    if (fromPath) return fromPath;
    throw new Error(`not a variant slug or path: ${candidate}`);
  }

  const cwdSlug = slugFromPath(process.cwd());
  if (cwdSlug && fs.existsSync(path.join(variantsDir, cwdSlug))) return cwdSlug;

  const candidates = fs
    .readdirSync(variantsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== "_base")
    .map((entry) => ({
      slug: entry.name,
      file: path.join(variantsDir, entry.name, "onepager.yaml"),
    }))
    .filter(({ file }) => fs.existsSync(file))
    .sort((a, b) => fs.statSync(b.file).mtimeMs - fs.statSync(a.file).mtimeMs);

  if (candidates[0]) return candidates[0].slug;
  if (fs.existsSync(path.join(variantsDir, "_base"))) return "_base";
  throw new Error("no variant found; pass a slug or path");
}

try {
  if (args.includes("--help") || args.includes("-h")) {
    console.log(REBUILD_USAGE);
    console.log("--skip-review: human-only; skips content and agent visual review, keeps PDF fit and ATS checks.");
    process.exit(0);
  }
  const { candidate, skipReview } = parseRebuildArgs(args);
  const slug = inferSlug(candidate);
  console.log(`rebuild ${slug}`);
  const buildArgs = [path.join(root, "build.mjs"), slug, "--workspace", workspaceDir];
  if (skipReview) buildArgs.push("--skip-review");
  const result = spawnSync(process.execPath, buildArgs, {
    cwd: root,
    stdio: "inherit",
  });
  process.exit(result.status ?? 1);
} catch (error) {
  console.error(`error: ${error.message}`);
  process.exit(1);
}
