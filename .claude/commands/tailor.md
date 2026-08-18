---
description: Tailor the CV + appendix to a specific job posting
argument-hint: <path to a job description file, or paste the JD text after the command>
---

You are tailoring Pavel's CV for a specific job application. Read `CLAUDE.md` first if you haven't already this session — it has the truthfulness rule, sanitization rules, one-page discipline, the facts-vs-positioning split, and the bullet-quality rules that govern everything below.

The job description (or a path to it) is: $ARGUMENTS

## Steps

1. **Get the JD.** If `$ARGUMENTS` looks like a file path, read it. Otherwise treat it as the pasted JD text directly. Extract: the exact target title, key requirements, and what the posting emphasizes (leadership vs. hands-on, specific technologies, specific domain like AI/governance/platform).

2. **Pick a variant slug.** Short kebab-case from company + role, e.g. `acme-head-of-data-governance`. Create `variants/<slug>/`.

3. **Save the JD.** Write it verbatim to `variants/<slug>/job-post.md`.

4. **Write down the posting's vocabulary.** Before writing any CV content, extract the phrases a screener will keyword-match on into `variants/<slug>/jd-keywords.yaml` — `must_have:` for stated requirements, `nice_to_have:` for preferences. Use the posting's own wording, and add `aliases:` where Pavel's evidence uses a different term for the same thing. Keep `must_have` to what the posting actually requires; a padded list makes the coverage report useless.

5. **Choose the headline.** Set `headline:` in `onepager.yaml` to the posting's job title when the scope and seniority are ones Pavel has actually operated at. When they aren't, use the nearest honest label and note the delta in `rationale.md` — the honesty guard in `CLAUDE.md` governs this, and it is the one place where a plausible-looking tweak becomes a fabrication. Keep it under ~42 characters.

6. **Select and reword from the evidence bank.** Read every file in `data/evidence/`. For each role in `data/profile.yaml`, decide which bullets (or reworded versions) best match this JD, pulling phrasing and emphasis from the matching dossier. Two rules that matter more than the rest:
   - **Lead with the result.** Each dossier has a `## Result lenses` section (scale / help / problems / leadership) — take the result clause from there rather than re-deriving it. A bullet that states only volume hasn't made the jump the guide is about. Where a lens reads "none recorded", respect that and don't manufacture one.
   - **Use active completed actions** — built, shipped, led, designed, delivered. Never "responsible for".

   Write the result to `variants/<slug>/onepager.yaml`:
   - `headline:` — from step 5.
   - `profile:` — a tailored 3-4 sentence profile paragraph (leave blank to use the default).
   - `roles:` — only include roles whose bullets you're changing; omitted roles keep `profile.yaml`'s defaults untouched. Each role override needs `employer`, `title` (must match `profile.yaml` exactly), and `bullets`.
   - `expertise:` — optional. Drop and reorder groups/items to present one clear role rather than breadth, putting what the posting asks for first. Every item must exist verbatim in that group in `profile.yaml`; the build fails if not.

7. **Write the tailored appendix.** Using `variants/_base/appendix.md` as the structural template, write `variants/<slug>/appendix.md`: same per-role dossier structure, reordered/reworded to foreground what this JD cares about. You may include more of a dossier's detail here than fits the one-pager — the appendix has no length limit. Still: every sentence must trace to an evidence file. This is also where must-have keywords that don't fit the one-pager can legitimately land.

8. **Write the cover letter.** `variants/<slug>/cover-letter.md`, exactly three short paragraphs on one page: (1) who Pavel is and why he matches this role, (2) why *this* company specifically, (3) a call to action. Paragraph 2 must rest on something concrete from the job post or a source you name — if the posting gives you nothing specific, say so in `rationale.md` rather than writing generic praise. Same truthfulness and sanitization rules as the CV.

9. **Build.** Run `node build.mjs <slug>`, then **read the advisory output and act on it**:
   - One-pager overflow is a hard failure — trim per the cut order in `CLAUDE.md` and rebuild. Never hand back a variant that failed to build.
   - Bullet lint findings: fix `weak-verb` and `no-result-no-scale` findings. For `scale-only`, pull a result clause from the dossier's `## Result lenses`; if the evidence genuinely has no outcome for that bullet, leave it and say so in the rationale.
   - Keyword coverage: for each miss, decide honestly — add it if the evidence backs it (one-pager if it's central, appendix if it's supporting), otherwise record it as a gap. Do not stuff.

10. **Write the rationale.** In `variants/<slug>/rationale.md`, document:
   - The headline chosen, and — if it doesn't match the posting's title — why, and what the delta is.
   - What was emphasized and why, tied to specific JD requirements.
   - What was cut from the default one-pager, and why.
   - A claim → evidence trace for anything non-obvious.
   - Keyword coverage: which must-have terms are missing and, for each, whether it's an honest gap or a deliberate choice.
   - Any JD requirement Pavel does not clearly meet, stated plainly — do not paper over gaps.

11. **Sanity check.** Grep `variants/<slug>/` (`onepager.yaml`, `appendix.md`, `cover-letter.md`, `rationale.md`) for ticket-key patterns (`[A-Z]{2,10}-[0-9]+`) and the codename list in `CLAUDE.md`. Fix any hits before reporting done.

Report back: the variant slug, the output file paths, the headline used, keyword coverage, and a short summary of what was emphasized and any gaps flagged in the rationale.
