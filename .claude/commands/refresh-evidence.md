---
description: Re-check the evidence bank against the current state of Pavel's private notes vault
argument-hint: (optional) a specific evidence file to check, e.g. semrush-data-ownership
---

Each file in `data/evidence/` ends with a `Source:` line naming the vault note(s) it was extracted from (paths relative to Pavel's private notes vault — see his global instructions for the actual location; it is not part of this repo). Your job is to check whether those dossiers are still accurate — **never auto-write changes**.

Target: $ARGUMENTS (if empty, check every file in `data/evidence/`)

## Steps

1. For each dossier in scope, read its `Source:` line and open the referenced vault note(s) in Pavel's private notes vault.
2. Compare the vault note's current content against the dossier's claims: has scope, scale, status, or outcome changed since the dossier was written?
3. For any drift found, propose a specific edit (old text → new text) rather than rewriting the whole file. Re-apply the same sanitization rules from `CLAUDE.md` (no ticket keys, no colleague names, no internal codenames, rounded numbers) to any new material pulled from the vault.
4. Present the proposed diffs to Pavel for review. Do not write them to `data/evidence/` until he confirms.
5. If a vault project's status has flipped to `done` or `paused` (check the note's frontmatter), flag that explicitly — it may mean the dossier should shift from present tense to past tense, or that outcome numbers can now be finalized instead of described as in-progress.

Report a short summary: which dossiers were checked, which are still accurate as-is, and which have proposed updates awaiting approval.
