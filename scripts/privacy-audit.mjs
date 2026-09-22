#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const denylistIndex = args.indexOf("--denylist");
const denylistPath = denylistIndex >= 0 ? args[denylistIndex + 1] : null;

const candidates = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", "-z"], { cwd: root })
  .toString("utf8").split("\0").filter(Boolean);
const forbiddenPaths = [/^\.cv-local\//, /^cv\.local\.yaml$/, /^data\//, /^variants\//, /^inbox\//, /^archive\//];
const forbiddenBinary = /\.(pdf|docx?|pages)$/i;
const checks = [
  { label: "absolute home path", regex: /\/(Users|home)\/[A-Za-z0-9._-]+\//g },
  { label: "non-example email", regex: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, allow: (value) => /@example\.com$|@users\.noreply\.github\.com$/i.test(value) },
  { label: "phone number", regex: /\+?\d[\d ()-]{8,}\d/g, allow: (value) => /202[- )]?555[- ]?01\d{2}/.test(value) || /^\d{4}-\d{2}-\d{2}$/.test(value) },
  { label: "private-source reference", regex: /private (obsidian|notes) vault|source:\s*`?projects\//gi },
];

const denylist = denylistPath && fs.existsSync(denylistPath)
  ? fs.readFileSync(denylistPath, "utf8").split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !line.startsWith("#"))
  : [];
const findings = [];

for (const relative of candidates) {
  const absolute = path.join(root, relative);
  if (!fs.existsSync(absolute) || fs.statSync(absolute).isDirectory()) continue;
  if (forbiddenPaths.some((pattern) => pattern.test(relative))) findings.push(`${relative}: private root path is tracked`);
  if (forbiddenBinary.test(relative)) findings.push(`${relative}: document binaries are not allowed in the public tree`);
  const buffer = fs.readFileSync(absolute);
  if (buffer.includes(0)) continue;
  const text = buffer.toString("utf8");
  for (const check of checks) {
    for (const match of text.matchAll(check.regex)) {
      if (!check.allow?.(match[0])) findings.push(`${relative}: ${check.label}`);
    }
  }
  const lower = text.toLowerCase();
  for (const entry of denylist) {
    if (lower.includes(entry.toLowerCase())) findings.push(`${relative}: private denylist match`);
  }
}

if (findings.length) {
  console.error(`public privacy audit failed with ${findings.length} finding(s):`);
  [...new Set(findings)].forEach((finding) => console.error(`  ${finding}`));
  process.exit(1);
}
console.log(`public privacy audit passed (${candidates.length} files checked)`);
