import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const shared = ".agents/skills/tailor/SKILL.md";

test("Codex, Claude Code, and Cursor tailoring entry points resolve one shared workflow", () => {
  const skill = fs.readFileSync(path.join(root, shared), "utf8");
  for (const fragment of ["profile.yaml", "data/evidence/", "design.yaml", "ats-evidence.json", "audit:public", "rebuild"]) {
    assert.ok(skill.includes(fragment), fragment);
  }
  for (const adapter of ["AGENTS.md", "CLAUDE.md", ".claude/skills/tailor/SKILL.md", ".claude/commands/tailor.md", ".cursor/skills/tailor/SKILL.md", ".cursor/commands/tailor.md"]) {
    const content = fs.readFileSync(path.join(root, adapter), "utf8");
    assert.ok(content.includes(shared), adapter);
  }
});
