import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { DEFAULT_WORKSPACE, resolveWorkspace } from "../scripts/lib/workspace.mjs";

test("workspace resolution defaults to the fictional example", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "cv-workspace-"));
  const result = resolveWorkspace({ root, argv: [], env: {} });
  assert.equal(result.workspaceDir, path.join(root, DEFAULT_WORKSPACE));
  assert.equal(result.source, "default");
});

test("CLI overrides environment and strips workspace arguments", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "cv-workspace-"));
  const result = resolveWorkspace({ root, argv: ["_base", "--workspace", "cli-data"], env: { CV_WORKSPACE: "env-data" } });
  assert.equal(result.workspaceDir, path.join(root, "cli-data"));
  assert.deepEqual(result.args, ["_base"]);
  assert.equal(result.source, "cli");
});

test("local config overrides the default", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "cv-workspace-"));
  fs.writeFileSync(path.join(root, "cv.local.yaml"), 'workspace: ".cv-local/workspace"\n');
  const result = resolveWorkspace({ root, argv: [], env: {} });
  assert.equal(result.workspaceDir, path.join(root, ".cv-local/workspace"));
  assert.equal(result.source, "local-config");
});
