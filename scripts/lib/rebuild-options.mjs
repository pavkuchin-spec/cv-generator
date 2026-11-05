export const REBUILD_USAGE = "usage: npm run rebuild -- [<slug-or-path>] [--workspace <path>] [--skip-review]";

// This is a workflow guard, not an authentication boundary. Agents must never
// remove these markers or allocate a terminal to use the human-only shortcut.
export function assertHumanReviewSkip({ env = process.env, interactive = Boolean(process.stdin.isTTY && process.stdout.isTTY) } = {}) {
  const agentSession = Object.entries(env).some(([key, value]) => value &&
    /^(?:CODEX_|CURSOR_AGENT(?:_|$)|CLAUDE_CODE_|CLAUDECODE$)/.test(key));
  if (agentSession) throw new Error("--skip-review is human-only and cannot run in an agent session");
  if (!interactive) throw new Error("--skip-review requires a human running in an interactive terminal");
}

export function parseRebuildArgs(args, context) {
  let candidate;
  let skipReview = false;
  for (const arg of args) {
    if (arg === "--skip-review") skipReview = true;
    else if (arg.startsWith("-")) throw new Error(`unknown option: ${arg}\n${REBUILD_USAGE}`);
    else if (candidate !== undefined) throw new Error(`expected one variant slug or path\n${REBUILD_USAGE}`);
    else candidate = arg;
  }
  if (skipReview) assertHumanReviewSkip(context);
  return { candidate, skipReview };
}
