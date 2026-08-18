---
description: Rebuild the PDFs for a variant after a manual edit
argument-hint: <variant-slug>
---

Run `node build.mjs $ARGUMENTS` and report the result.

- If it succeeds, confirm the output files exist under `variants/$ARGUMENTS/out/` (onepager.pdf, appendix.pdf, cv-plain.txt) and report the one-pager's fit (full scale or which autofit scale it landed on).
- If it fails on one-page overflow, read `variants/$ARGUMENTS/onepager.yaml`, apply the cut order from `CLAUDE.md` (profile prose → oldest-role bullets → expertise items — never contact/dates/employers), and rebuild. Repeat until it passes.
- If it fails for any other reason (missing variant, bad YAML, unknown role in an override), fix the root cause — don't work around it.
