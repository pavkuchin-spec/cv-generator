# Personal spec-driven, agent-operated tooling practice

## Problem
Tailoring a CV and appendix per job application by hand is slow and drifts: facts and positioning get mixed together, sanitization rules get forgotten between edits, and one-page overflow only gets caught by eyeballing the PDF. Doing this well repeatedly needed a system, not repeated manual effort — and building that system was also a chance to practice the same agentic-coding discipline (spec-driven development, an AI coding assistant operating against a written spec) that this practice has been built around since mid-2025.

## What I did
- Designed and built a spec-driven CV-generation pipeline (this repository) meant to be operated end-to-end by an agentic coding assistant (Claude Code): paste a job description in, get tailored one-pager, appendix, and cover-letter PDFs out.
- Wrote the executable spec the assistant follows on every run: a truthfulness rule (every claim must trace to a source file), a sanitization checklist (no ticket keys, no colleague names, no internal codenames), a one-page-fit invariant, and an explicit "facts vs. positioning" split governing what may change between applications and what may never change.
- Built the underlying Node.js pipeline: renders PDFs via headless Chrome from structured YAML/Markdown source data, plus a plain-text export.
- Built two advisory checks into the pipeline itself rather than relying on manual review: a bullet-quality linter (flags weak openers, and bullets that state scale without a result) and a JD-keyword coverage report (checks the posting's own vocabulary against what actually appears on each surface).
- Iterated the spec and pipeline across multiple real job applications, treating each as a test of whether the guardrails actually held (e.g., catching one-page overflow automatically, refusing to let a variant invent a claim not in the evidence bank).

## Scale & outcome
One versioned, reusable pipeline (spec + build script + linting/coverage checks) replacing ad hoc manual tailoring, in active use across multiple tailored job-application variants. The spec itself is the enforcement mechanism — sanitization and truthfulness violations are things the assistant is instructed to catch on every run, not something re-checked by hand each time.

## Result lenses
- **Scale** — one spec-driven pipeline covering one-pager, appendix, and cover-letter generation, a bullet-quality linter, and a JD-keyword coverage checker, reused across every tailored job-application variant produced since mid-2025.
- **Help** — myself as the primary user: turns a multi-hour manual tailoring and formatting pass into a spec-and-review workflow, and catches mistakes (overflow, invented claims, sanitization slips) mechanically instead of by re-reading the whole document each time.
- **Problems** — inconsistent tailoring and sanitization drift across hand-edited variants, and one-page overflow that previously only showed up by opening the rendered PDF; the pipeline now fails the build on overflow and reports lint/keyword findings on every run.
- **Leadership** — designed the spec itself (the rules an agentic assistant must follow), not just used an existing tool: wrote the truthfulness rule, the honesty guard on positioning claims, and the sanitization checklist that make it safe to delegate CV tailoring to an AI coding assistant.

## Technologies
Claude Code (agentic coding assistant, used hands-on/daily for this and other personal projects since mid-2025), spec-driven development (a written CLAUDE.md spec the assistant executes against), Node.js, headless Chrome PDF rendering, YAML/Markdown structured data modeling, git-based version control.

Source: this repository (`cv-generator`), a personal project — not Semrush work product, no sanitization needed.
