---
description: Rebuild the PDFs for a variant after a manual edit
argument-hint: <variant-slug>
---

Run `node build.mjs $ARGUMENTS` and report the result.

- If it succeeds, confirm the output files exist under `variants/$ARGUMENTS/out/` (onepager.pdf, appendix.pdf, cv-plain.txt, and cover-letter.pdf if the variant has a `cover-letter.md`) and report the one-pager's fit (full scale or which autofit scale it landed on).
- If it fails on one-page overflow, read `variants/$ARGUMENTS/onepager.yaml`, apply the cut order from `CLAUDE.md` (profile prose → oldest-role bullets → `expertise:` override items — never contact/dates/employers), and rebuild. Repeat until it passes.
- If it fails for any other reason (missing variant, bad YAML, unknown role in an override, an `expertise:` item that isn't in `profile.yaml`), fix the root cause — don't work around it.

**Advisory output — report it, don't treat it as failure.** Overflow is the only hard failure. The build also prints:
- **bullet lint** — `weak-verb`, `no-result-no-scale`, `scale-only`. Surface these to Pavel; offer to fix them by pulling a result clause from the relevant dossier's `## Result lenses`. `variants/_base` emits several by design, so lint findings there are expected, not a regression.
- **keyword coverage** — must-have / nice-to-have hits against the one-pager (`1p`) and appendix (`apx`), if the variant has a `jd-keywords.yaml`. Report misses and whether each looks like an honest gap; never add a keyword the evidence bank doesn't support.
- **headline length warning** — the header wraps past ~42 characters and there is no one-page headroom, so shorten it.
