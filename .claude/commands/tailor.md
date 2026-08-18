---
description: Tailor the CV + appendix to a specific job posting
argument-hint: <path to a job description file, or paste the JD text after the command>
---

You are tailoring Pavel's CV for a specific job application. Read `CLAUDE.md` first if you haven't already this session — it has the truthfulness rule, sanitization rules, and one-page discipline that govern everything below.

The job description (or a path to it) is: $ARGUMENTS

## Steps

1. **Get the JD.** If `$ARGUMENTS` looks like a file path, read it. Otherwise treat it as the pasted JD text directly. Extract: target title, key requirements, and what the posting emphasizes (leadership vs. hands-on, specific technologies, specific domain like AI/governance/platform).

2. **Pick a variant slug.** Short kebab-case from company + role, e.g. `acme-head-of-data-governance`. Create `variants/<slug>/`.

3. **Save the JD.** Write it verbatim to `variants/<slug>/job-post.md`.

4. **Select and reword from the evidence bank.** Read every file in `data/evidence/`. For each role in `data/profile.yaml`, decide which bullets (or reworded versions of them) best match this JD — pulling phrasing and emphasis from the matching evidence dossier. Do not invent anything not present in the evidence. Write the result to `variants/<slug>/onepager.yaml`:
   - `profile:` — a tailored 3-4 sentence profile paragraph (leave blank to use the default).
   - `roles:` — only include roles whose bullets you're changing; omitted roles keep `profile.yaml`'s defaults untouched. Each role override needs `employer`, `title` (must match `profile.yaml` exactly), and `bullets`.

5. **Write the tailored appendix.** Using `variants/_base/appendix.md` as the structural template, write `variants/<slug>/appendix.md`: same per-role dossier structure, but reordered/reworded to foreground what this JD cares about. You may include more of a dossier's detail here than fits the one-pager — the appendix has no length limit. Still: every sentence must trace to an evidence file.

6. **Build.** Run `node build.mjs <slug>`. If it fails on one-pager overflow, trim per the cut order in `CLAUDE.md` and rebuild. Do not hand back a variant that fails to build.

7. **Write the rationale.** In `variants/<slug>/rationale.md`, document:
   - What was emphasized and why (tie back to specific JD requirements).
   - What was cut from the default one-pager, and why.
   - A claim → evidence trace for anything non-obvious.
   - Any JD requirement Pavel does not clearly meet, stated plainly — do not paper over gaps.

8. **Sanity check.** Grep `variants/<slug>/appendix.md` and `onepager.yaml` for ticket-key patterns (`[A-Z]{2,10}-[0-9]+`) and the codename list in `CLAUDE.md`. Fix any hits before reporting done.

Report back: the variant slug, the output file paths, and a short summary of what was emphasized and any gaps flagged in the rationale.
