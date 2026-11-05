# Agent guide

For a new job application, use the repository skill at `.agents/skills/tailor/SKILL.md`. It defines workspace isolation, evidence and privacy rules, design selection, and PDF report review. For an existing variant that only needs rendering, use `npm run rebuild -- <slug>`.

`--skip-review` is a human-only terminal flag. Agents must never invoke it or remove agent environment markers to bypass its guard. If a human runs a rebuild with this flag, report the result without launching a post-render visual review. Content inventory review is skipped; one-page fit and ATS extraction remain required.
