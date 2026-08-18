# cv-generator

Turn a job posting into a tailored CV in minutes, without touching Canva.

You get two PDFs per application:

- **One-pager** — the strict, single-page CV, same look as the original Canva design, for humans.
- **Appendix** — a long-form, multi-page project portfolio, for AI resume screeners and recruiters who want depth.

Plus a plain-text `.txt` version as an ATS safety net (some applicant tracking systems mangle two-column PDFs).

## How to use it

Open this folder in Claude Code and run:

```
/tailor <path-to-job-description.txt>
```

or just paste the job description text after the command. Claude will:

1. Read the JD and figure out what it's emphasizing (leadership? a specific technology? a specific domain?).
2. Pick bullets — and reword them — from the evidence bank (`data/evidence/`) to match.
3. Build both PDFs.
4. Write `rationale.md` explaining what it emphasized, what it cut, and — importantly — **flag anything the job wants that isn't actually backed by evidence**, instead of quietly making something up.

Everything lands in `variants/<company-role-slug>/`.

If you want to tweak a variant by hand afterward, edit its `onepager.yaml` or `appendix.md` and run:

```
/build <slug>
```

## Why it won't lie for you

Every sentence in a tailored CV has to trace back to something in `data/evidence/*.md` or `data/profile.yaml`. Claude can *re-select* and *reword* your real experience to fit a role, but it can't invent a metric, upgrade a title, or claim a technology you haven't used. If a posting wants something you genuinely don't have, that gets written down plainly in `rationale.md` instead of papered over. This rule (and a few others — sanitization, one-page cut order) lives in `CLAUDE.md`, which is what the agent actually reads before doing any tailoring.

## The one-page rule is enforced, not just requested

The one-pager build **fails on purpose** if content doesn't fit — it won't hand you a CV that secretly spilled onto page two. Before failing, it tries shrinking everything slightly (down to 94% scale) to absorb small overages. If it still doesn't fit, it tells you the overflow in millimeters so you know how much to cut, and Claude trims in a fixed order: profile paragraph first, then bullets from your oldest/least-relevant role, expertise list items last. Contact info, dates, and employer names are never touched.

## Where things live

```
data/
  profile.yaml       Stable facts: contact, roles, employers, dates, education, certs.
                      Changes rarely — these are facts, not spin.
  evidence/*.md       One dossier per notable project. This is the only material a
                      tailored CV is allowed to draw from.

variants/
  _base/              The untailored master. Should always look like your original
                      Canva CV — this is the trust anchor for the whole system.
  <slug>/             One folder per real application:
    job-post.md         the JD you gave it
    onepager.yaml        tailored one-pager content
    appendix.md          tailored long-form appendix
    rationale.md         what changed and why, + any honest gaps
    out/                 the actual PDFs + plain-text CV

templates/            HTML/CSS for both documents, plus vendored fonts (Hanken
                      Grotesk + Roboto — the open equivalents of the fonts your
                      Canva CV used) so builds work offline and look identical
                      every time.

archive/              Your original Canva-exported PDF, kept as the visual reference.
```

## Keeping the evidence bank current

Your `data/evidence/` dossiers were extracted once from a private notes vault (not part of this repo), with names, ticket IDs, and internal codenames stripped out and numbers rounded — so nothing sensitive ends up in a document you hand to an external recruiter. Projects keep moving after that extraction, though. Run:

```
/refresh-evidence
```

to have Claude re-read the source vault notes and propose updates to the dossiers — it always shows you the diff first rather than silently rewriting anything.

## Manual builds

```
npm install        # once
node build.mjs <slug>
```

Chrome (already installed on this machine) does the actual PDF rendering; no network access needed at build time.
