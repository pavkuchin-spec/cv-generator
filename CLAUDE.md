# cv-generator — agent guide

This repo produces per job application, from structured source data: a strict **one-page CV** (for humans), a **long-form appendix** (for AI/ATS scanning and recruiters who want depth), and optionally a **three-paragraph cover letter**. It is designed to be operated by an agent: paste a job description, get tailored PDFs back.

## How the pipeline works

```
data/profile.yaml       — stable facts: contact, roles, dates, education, certs (rarely edited)
data/evidence/*.md      — sanitized project dossiers, the claim bank for tailoring
variants/<slug>/        — one folder per application
  job-post.md           — the pasted JD
  jd-keywords.yaml       — the posting's own vocabulary, for the coverage check
  onepager.yaml          — tailored one-pager content (headline + profile text + bullet/expertise overrides)
  appendix.md            — tailored long-form appendix (markdown, rendered to PDF)
  cover-letter.md        — optional three-paragraph cover letter (markdown, rendered to PDF)
  rationale.md           — what was emphasized/cut + claim→evidence trace
  out/                   — onepager.pdf, appendix.pdf, cover-letter.pdf, cv-plain.txt
```

Build a variant with:
```
node build.mjs <slug>
```
This renders the PDFs via headless Chrome and a plain-text CV, and **exits non-zero if the one-pager doesn't fit on one page** — it will report the overflow in mm and which scale factors it tried. This is a hard invariant, not a suggestion: never hand back a variant that failed to build.

The build also prints two **advisory** reports that never change the exit code — bullet lint and JD keyword coverage (both described under *Positioning & bullet quality* below). Read them and act on them; they are signal, not gates. `variants/_base` deliberately emits several lint findings — that is the tool working, not a regression.

## The truthfulness rule — the most important rule in this repo

Every claim in `onepager.yaml` and `appendix.md` must trace back to a specific line in `data/evidence/*.md` or `data/profile.yaml`. When tailoring:
- You may re-select which bullets to surface, and reword/re-emphasize them for the target role.
- You may **not** invent scope, upgrade a title, add a metric that isn't in the evidence, or claim a technology/outcome not backed by a dossier.
- If a job description wants something Pavel genuinely hasn't done, say so plainly in `rationale.md` — do not paper over the gap with a manufactured bullet.
- Employer names, job titles as held, employment dates, and education are fixed and must never change between variants. The CV's *header headline* is a separate thing and may change — see *Facts vs. positioning* below.

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
3. Trim expertise list items last, and only if still over — via an `expertise:` override in `onepager.yaml` (a validated subset of `profile.yaml`, see below). Do not edit `data/profile.yaml` to make one variant fit.

Note `_base` currently fits at exactly 297.0mm of a 297mm page, so there is effectively no headroom: anything added to the one-pager has to displace something else.

The build script's `--autofit` behavior (automatic, no flag needed) will first try shrinking a scale variable slightly (down to 94%) before failing outright — a build that fails even after autofit means real content needs to be cut, not just squeezed.

## Facts vs. positioning — what may move between variants

Tailoring changes *emphasis and selection*, never *facts*. Two distinct groups:

**Facts — never change.** Name. Employer names. Job titles as actually held (the titles printed inside Work Experience). Employment dates. Education. Contact info.

**Positioning surface — should change per application.**
- `headline:` in `onepager.yaml` — the line printed under the name in the header (defaults to `profile.yaml`'s `headline_default`). This is a claim about which role the application presents Pavel as, not a claim about a title he held.
- `profile:` — the profile paragraph.
- `roles:` — which bullets surface, and their wording.
- `expertise:` — which expertise groups and items surface, and in what order.

**The honesty guard on the headline.** It may match the vacancy's job title only when the scope and seniority are ones Pavel has actually operated at, evidenced in `data/evidence/`. Otherwise use the nearest honest label and record the delta in `rationale.md`. Never a title he has not held at the level implied — "Head of Data Governance" for a role that was a 3-person team lead is a fabrication, even though it's only a header. Keep it under ~42 characters; the header is uppercase with wide letter-spacing and wraps (the build warns past that).

The `expertise:` override is validated as a **subset** of `profile.yaml`: every item must already exist verbatim in that group, or the build fails naming the offending item. It can drop and reorder, never invent.

## Positioning & bullet quality

Adopted from `research/resume-writing-notes/noukash-cv-guide.md` (a third-party guide — a checking lens, not a source of truth; the truthfulness rule always wins).

**Position from the vacancy, not from self-perception.** Present one clear role, not breadth. Narrow the `expertise:` override toward what the posting asks for rather than showing all three groups by default, and match the header headline to the posting's title within the honesty guard above.

**Match the posting's vocabulary.** Screeners keyword-match against the job post. Write the posting's own phrases into `variants/<slug>/jd-keywords.yaml`:
```yaml
must_have:
  - data lineage
  - term: stakeholder management       # aliases count as a hit
    aliases: [stakeholder coordination]
nice_to_have:
  - data mesh
```
The build then reports which terms an ATS will actually find, and on which surface (`1p` = one-pager, `apx` = appendix). **A miss is not automatically a defect** — "Snowflake" missing is the honest answer when the evidence says BigQuery. Close a gap only if the evidence bank genuinely backs it; otherwise record it in `rationale.md`. Never stuff a keyword the evidence doesn't support.

**Write bullets that state what changed.** The build lints every bullet and reports three things, none fatal:
- `weak-verb` — opens with "responsible for", "worked on", "participated in" and similar. Use an active completed action: built, shipped, led, designed, delivered.
- `no-result-no-scale` — the bullet says neither what changed nor how much of it there was. Weakest form; fix it or cut it.
- `scale-only` — the bullet states volume but not outcome. This is the guide's central point: *scale is not a result.* "Designed and scaled the Data Ownership framework across 50+ analysts" states size; what changed is that ownership stopped decaying because CI now fails builds on missing owners.

**When a bullet has no obvious result, use the four lenses.** Every dossier in `data/evidence/` now carries a `## Result lenses` section — **Scale**, **Help** (whose job got easier), **Problems** (which fires stopped), **Leadership** (what was owned end to end) — pre-derived from that dossier's own body. Pull the result clause from there rather than re-deriving it, and never from outside the dossier. Where a lens reads "none recorded", that is deliberate: those roles predate the notes vault and must not be expanded.

**Cover letter**, when one is written: exactly three short paragraphs on one page — (1) who you are and why you match, (2) why *this* company specifically, (3) a call to action. Paragraph 2 must rest on something concrete from the job post or a source you name; if there is nothing specific to say, note that in `rationale.md` rather than filling the letter with generic praise. Same truthfulness and sanitization rules as everything else.

## Rendering details (only relevant if templates/build.mjs need changes)

- Fonts are vendored in `templates/fonts/` (Hanken Grotesk, Roboto) for offline, reproducible builds — don't switch to a CDN font link.
- HTML is rendered via a temp file written into `templates/` (not via `page.setContent()`) because Chrome blocks `file://` stylesheet loads from an `about:blank`-origin document — see the comment in `build.mjs`'s `renderViaTempFile`.
- The one-pager's `.page` div uses `min-height: 297mm`, not a fixed height, so overflowing content spills onto a real second PDF page (which the pagecount check detects) instead of being silently clipped.
- `templates/cover-letter.html` shares `appendix.css` (the `.letter` rules at the end of that file) rather than carrying its own stylesheet — same page furniture, prose-shaped body.
- `variants/_base/` is the trust anchor: it should always reproduce `archive/CV_DG_team_lead.pdf` closely. If you change `templates/onepager.css`, rebuild `_base` and visually confirm it still matches before touching a live application variant. `_base` sets no `headline:` and no `expertise:` override, so it must keep rendering `DATA GOVERNANCE TEAM LEAD` and all three expertise groups.
