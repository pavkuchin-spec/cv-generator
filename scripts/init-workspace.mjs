#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(root, "examples/software-engineer");
const destination = path.join(root, "cv-local/workspace");
const variantsDir = path.join(root, "variants");
const localConfig = path.join(root, "cv.local.yaml");

if (fs.existsSync(destination) || fs.existsSync(localConfig) || fs.existsSync(variantsDir)) {
  console.error("Private workspace already exists; refusing to overwrite it.");
  process.exit(1);
}

fs.mkdirSync(path.dirname(destination), { recursive: true });
fs.cpSync(source, destination, { recursive: true });
fs.renameSync(path.join(destination, "variants"), variantsDir);
fs.writeFileSync(localConfig, 'workspace: "cv-local/workspace"\n');
console.log("Created cv-local/workspace, variants, and cv.local.yaml.");
console.log("All are ignored by Git. Replace the fictional data with your own evidence.");
