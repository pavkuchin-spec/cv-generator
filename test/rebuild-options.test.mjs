import assert from "node:assert/strict";
import test from "node:test";
import { assertHumanReviewSkip, parseRebuildArgs } from "../scripts/lib/rebuild-options.mjs";

const humanTerminal = { env: {}, interactive: true };

test("ordinary rebuilds allow agent sessions and keep review enabled", () => {
  assert.deepEqual(parseRebuildArgs(["example"], { env: { CODEX_SESSION_ID: "test" }, interactive: false }), {
    candidate: "example", skipReview: false,
  });
  assert.deepEqual(parseRebuildArgs([]), { candidate: undefined, skipReview: false });
});

test("human flag parses before or after a variant, and without a variant", () => {
  for (const args of [["example", "--skip-review"], ["--skip-review", "example"]]) {
    assert.deepEqual(parseRebuildArgs(args, humanTerminal), { candidate: "example", skipReview: true });
  }
  assert.deepEqual(parseRebuildArgs(["--skip-review"], humanTerminal), { candidate: undefined, skipReview: true });
});

test("agent sessions cannot take the human shortcut even with an interactive terminal", () => {
  for (const key of ["CODEX_SESSION_ID", "CODEX_CI", "CURSOR_AGENT", "CURSOR_AGENT_ID", "CLAUDECODE", "CLAUDE_CODE_ENTRYPOINT"]) {
    assert.throws(() => assertHumanReviewSkip({ env: { [key]: "1" }, interactive: true }), /human-only/);
  }
  assert.throws(() => assertHumanReviewSkip({ env: {}, interactive: false }), /interactive terminal/);
});

test("unknown flags and extra variants fail instead of being silently ignored", () => {
  assert.throws(() => parseRebuildArgs(["example", "--skip-reveiw"]), /unknown option/);
  assert.throws(() => parseRebuildArgs(["example", "another"]), /expected one variant/);
});
