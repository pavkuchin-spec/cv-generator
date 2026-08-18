# cv-generator — agent guide

This repo produces two PDFs per job application from structured source data: a strict **one-page CV** (for humans) and a **long-form appendix** (for AI/ATS scanning and recruiters who want depth). It is designed to be operated by an agent: paste a job description, get tailored PDFs back.

## How the pipeline works

```
data/profile.yaml       — stable facts: contact, roles, dates, education, certs (rarely edited)
data/evidence/*.md      — sanitized project dossiers, the claim bank for tailoring
variants/<slug>/        — one folder per application
  job-post.md           — the pasted JD
  onepager.yaml          — tailored one-pager content (profile text + role bullet overrides)
  appendix.md            — tailored long-form appendix (markdown, rendered to PDF)
  rationale.md           — what was emphasized/cut + claim→evidence trace
  out/                   — onepager.pdf, appendix.pdf, cv-plain.txt (build output)
```

Build a variant with:
```
node build.mjs <slug>
```
This renders both PDFs via headless Chrome and a plain-text CV, and **exits non-zero if the one-pager doesn't fit on one page** — it will report the overflow in mm and which scale factors it tried. This is a hard invariant, not a suggestion: never hand back a variant that failed to build.

## The truthfulness rule — the most important rule in this repo

Every claim in `onepager.yaml` and `appendix.md` must trace back to a specific line in `data/evidence/*.md` or `data/profile.yaml`. When tailoring:
- You may re-select which bullets to surface, and reword/re-emphasize them for the target role.
- You may **not** invent scope, upgrade a title, add a metric that isn't in the evidence, or claim a technology/outcome not backed by a dossier.
- If a job description wants something Pavel genuinely hasn't done, say so plainly in `rationale.md` — do not paper over the gap with a manufactured bullet.
- Employer names, job titles as held, employment dates, and education are fixed and must never change between variants.

## Sanitization rules (already applied once to `data/evidence/`, must hold for every new/edited variant)

`data/evidence/*.md` was extracted from Pavel's private Obsidian vault and deliberately conservative-sanitized. Any new dossier, or any per-variant rewording, must preserve these rules:
- No Jira/ticket keys or Confluence page IDs (pattern like `DG-123`, `PAT-456`).
- No colleague names — refer to roles ("the VP of Analytics", "a data engineering team", "a go-to-market team").
- No internal codenames — generalize them (the metadata/lineage platform is "an enterprise metadata & lineage platform", not its internal program name; the unified platform initiative is "a unified data platform initiative"; the internal AI assistant is "the company's internal AI data assistant").
- Round precise internal numbers (`55,085 tables` → `50,000+ tables`; `17.6% coverage` → `roughly a fifth`).
- Nothing that reads as internal criticism of a named person.

Before finishing any tailoring pass, grep the new/changed files for ticket-key patterns and the codename list above — zero hits expected.

## One-page discipline

When `node build.mjs` reports overflow on the one-pager, cut in this order — never touch contact info, dates, or employer names:
1. Trim the profile paragraph first.
2. Cut bullets from the oldest/least-relevant role first (TechAudit, then DECO, then Sibedge) — Semrush stays fullest since it's current and most relevant.
3. Trim expertise list items last, and only if still over.

The build script's `--autofit` behavior (automatic, no flag needed) will first try shrinking a scale variable slightly (down to 94%) before failing outright — a build that fails even after autofit means real content needs to be cut, not just squeezed.

## Fixed elements — never change across variants

Name, employer names, job titles as actually held, employment dates, education, contact info. Tailoring changes *emphasis and selection*, never *facts*.

## Rendering details (only relevant if templates/build.mjs need changes)

- Fonts are vendored in `templates/fonts/` (Hanken Grotesk, Roboto) for offline, reproducible builds — don't switch to a CDN font link.
- HTML is rendered via a temp file written into `templates/` (not via `page.setContent()`) because Chrome blocks `file://` stylesheet loads from an `about:blank`-origin document — see the comment in `build.mjs`'s `renderViaTempFile`.
- The one-pager's `.page` div uses `min-height: 297mm`, not a fixed height, so overflowing content spills onto a real second PDF page (which the pagecount check detects) instead of being silently clipped.
- `variants/_base/` is the trust anchor: it should always reproduce `archive/CV_DG_team_lead.pdf` closely. If you change `templates/onepager.css`, rebuild `_base` and visually confirm it still matches before touching a live application variant.
