import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";

export const DEFAULT_WORKSPACE = "examples/software-engineer";

function readLocalConfig(root) {
  const configPath = path.join(root, "cv.local.yaml");
  if (!fs.existsSync(configPath)) return null;
  const parsed = yaml.load(fs.readFileSync(configPath, "utf8")) || {};
  if (typeof parsed.workspace !== "string" || !parsed.workspace.trim()) {
    throw new Error("cv.local.yaml must contain a non-empty workspace path");
  }
  return parsed.workspace;
}

export function resolveWorkspace({ root, argv = process.argv.slice(2), env = process.env } = {}) {
  if (!root) throw new Error("resolveWorkspace requires the repository root");

  const args = [];
  let cliWorkspace = null;
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--workspace") {
      if (!argv[i + 1]) throw new Error("--workspace requires a path");
      cliWorkspace = argv[i + 1];
      i += 1;
    } else if (arg.startsWith("--workspace=")) {
      cliWorkspace = arg.slice("--workspace=".length);
    } else {
      args.push(arg);
    }
  }

  const selected = cliWorkspace || env.CV_WORKSPACE || readLocalConfig(root) || DEFAULT_WORKSPACE;
  const workspaceDir = path.resolve(root, selected);
  return { workspaceDir, args, source: cliWorkspace ? "cli" : env.CV_WORKSPACE ? "env" : fs.existsSync(path.join(root, "cv.local.yaml")) ? "local-config" : "default" };
}

export function workspacePath(workspaceDir, ...parts) {
  return path.join(workspaceDir, ...parts);
}
