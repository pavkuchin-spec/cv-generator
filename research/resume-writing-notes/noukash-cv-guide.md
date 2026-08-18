# CV-writing notes — extracted from "Поиск работы — это воронка"

Source: `polniy_gayd.pdf` (14-slide deck / video summary), Андрей Новиков · Noukash,
channel `t.me/zerotooffer`. The deck covers the full job-search funnel (mindset,
positioning, resume, cover letter, LinkedIn, US market, interviews, salary negotiation).
**Only the resume/CV-relevant slides are extracted below** — mindset, LinkedIn outreach,
interview tactics, and salary negotiation were intentionally left out.

These are general career-advice heuristics from a third-party guide, not project rules.
They don't override this repo's own [CLAUDE.md](../../CLAUDE.md) (truthfulness rule,
sanitization rules, one-page discipline) — treat them as extra lenses to check tailoring
against, not a new source of truth.

## Positioning drives the resume (slide 3)

- Position from the target vacancy, not from self-perception: pick **one** clear role to
  present as ("I am a Data Scientist"), don't spread across several.
  "I can do a bit of everything" reads as invisible at the screening stage — the market
  matches on a specific role, not breadth.

## What a resume is for (slide 4)

- A resume is a **selling document**. Its only job: prove you've already done what the
  target vacancy asks for.
- HR doesn't evaluate the work itself — they **match keywords** against the job post.
  Aim for a 1:1 match with the vacancy's language.
- Format: classic, one page.
- Three rules for describing experience:
  1. Match the vacancy's required skills.
  2. Use active, completed-action verbs — "built," "shipped," "launched" (not "responsible for").
  3. State the result — what got easier for someone, what problem shrank, or the scale/volume of the work.

## Evolving a single bullet (slide 5)

Six-step progression, each version adding one dimension:

1. `Created a dashboard.` — says nothing
2. `Built a sales performance dashboard.` — + verb + domain
3. `Built 100+ sales performance dashboards.` — + scale
4. `Built 100+ interactive sales dashboards in Tableau.` — + quality + tool
5. `Built 100+ interactive Tableau dashboards, cutting weekly reporting time by 40%.` — + result
6. `Built 100+ interactive Tableau dashboards that cut reporting time 40%, enabling 5 teams to self-serve insights.` — + impact on people

**The biggest jump is step 5**: from "what I did" to "what changed." Result-oriented bullets outperform activity-described ones.

## "I don't have results" — four lenses to find them anyway (slide 6)

When a bullet feels result-less, check it against these four angles:

- **Scale** — a product with 3M+ MAU / $1M ARR is not the same claim as "a system for 100 users." If you can't state outcome, state *volume*: e.g. "500+ A/B tests launched and analysed."
- **Help** — who got their job easier because of what you did? Cross-functional collaboration is highly valued in Western hiring. Example: "mentoring + knowledge-sharing → analysis time −25%."
- **Problems** — what fires stopped happening? e.g. "Prevented recurring data inconsistencies, unblocking decision-making across teams."
- **Leadership** — what did you own end-to-end? e.g. "Increased MRR by 233% by leading a cross-functional growth group."

## Special cases (slide 7)

- **No experience at all**: build your own project. A side project with real users is
  experience — describe it through the same four lenses above.
- **Switching tracks/roles**: build a bridge — pull out the parts of your current
  experience that overlap with the target role (e.g. analyst → product via metrics and
  experimentation). Alternative: lean on a strong cover letter to make the bridge explicit.
- **Tailoring per vacancy**: ideally every resume is tailored to the specific posting.
  Hard minimum: the job title stated on the resume should match the job title in the
  vacancy. Minor mismatches between LinkedIn and the resume are fine — not a blocker.

## Cover letter, for context (slide 7, adjacent to CV but a separate artifact)

Three short paragraphs, nothing more:
1. About you — who you are and why you're a match.
2. About the company — why *this* company, specifically.
3. Close — a call to action ("let's talk").

A distinctive, specific story beats a generic template.

---

*Not extracted (out of scope for CV creation): mindset/volume-game framing, where to
find jobs, LinkedIn profile/outreach mechanics, US market realities for remote hires from
Russia, interview scorecard tactics, salary negotiation script. These live in the source
deck if needed later.*

---

## Adopted in this repo

Where each piece of the above is now enforced. The repo's own `CLAUDE.md` still
outranks all of it — where the guide's advice and the truthfulness rule disagree,
truthfulness wins, which is why several items below are advisory warnings rather
than gates.

| Guide advice | Where it lives now | Enforcement |
|---|---|---|
| Position from the vacancy; one clear role (s3) | `headline:` + `expertise:` overrides in `onepager.yaml`; *Facts vs. positioning* in `CLAUDE.md` | Headline free within the honesty guard; expertise validated as a subset of `profile.yaml` (build fails on invented items) |
| Resume job title should match the vacancy title (s7) | `headline:` override, resolved by `resolveHeadline()` in `build.mjs` | Agent choice, bounded by the honesty guard; build warns past ~42 chars |
| 1:1 keyword match with the posting (s4) | `variants/<slug>/jd-keywords.yaml` → `reportKeywordCoverage()` | Advisory report only (`1p`/`apx`/miss + %) — a miss is often the honest answer |
| Active completed-action verbs (s4) | `lintBullets()` → `weak-verb` | Advisory warning |
| State the result, not the activity (s4, s5) | `lintBullets()` → `scale-only`, `no-result-no-scale` | Advisory warning; scale and result are checked separately, because step 3 ≠ step 5 |
| Four lenses for finding a result (s6) | `## Result lenses` in every `data/evidence/*.md` | Pre-derived from each dossier's own body; "none recorded" where the dossier genuinely has nothing |
| Cover letter: three paragraphs (s7) | `variants/<slug>/cover-letter.md` → `cover-letter.pdf` via `templates/cover-letter.html` | Build warns if it runs past one page |

Deliberately not adopted: the "no experience at all → build a side project" and
"switching tracks" special cases (s7) don't apply to Pavel's situation, and nothing
in the guide overrides the sanitization rules — its advice to name scale and
specifics still stops at rounded numbers, no colleague names, and no internal
codenames.
