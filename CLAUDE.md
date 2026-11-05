# cv-generator agent guide

For a new job application, read and follow `.agents/skills/tailor/SKILL.md`. It is the shared source for workspace isolation, evidence and privacy rules, design selection, and PDF verification.

For a render-only change to an existing variant, use `npm run rebuild -- <slug>` without rewriting tailored content.

`--skip-review` is human-only: agents must never invoke it, clear agent environment markers or allocate a terminal to bypass its guard. When a human runs it, report the result without starting a post-render visual review. The flag skips content inventory review; one-page fit and ATS extraction remain required.
