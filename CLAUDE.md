# cv-generator agent guide

This repository turns structured candidate evidence and a job description into a one-page CV, appendix, cover letter, and plain-text CV.

## Workspace boundary

Resolve the active workspace in this order: an explicit `--workspace`, `CV_WORKSPACE`, `cv.local.yaml`, then the tracked fictional example. Real candidate data belongs only in `.cv-local/` or another ignored/external workspace. Never copy private candidate content into public examples, tests, comments, fixtures, or documentation.

## Truthfulness rule

Every tailored claim must trace to `data/profile.yaml` or a dossier in `data/evidence/` within the active workspace.

- Re-select and reword supported claims for the target role.
- Never invent scope, seniority, technologies, metrics, or outcomes.
- Employer names, held titles, dates, education, and contact facts do not change between variants.
- A header headline may match the vacancy only when the evidence supports the same function and seniority. Record any mismatch in `rationale.md`.
- State unsupported requirements as gaps instead of manufacturing a match.

## Sanitization rule

Application artifacts may be shared externally, so remove colleague names, ticket keys, internal URLs, repository names, codenames, confidential system identifiers, and unnecessarily precise internal figures. Refer to people by role and systems by function. Sanitization does not relax the truthfulness rule.

Before finishing, scan the changed variant for ticket-like identifiers, private paths, personal names that are not the candidate, and terms listed in the workspace's private denylist when one exists.

## Tailoring workflow

1. Save the job description as `variants/<slug>/job-post.md` in the active workspace.
2. Record its actual requirements in `jd-keywords.yaml` without padding.
3. Choose an honest headline and evidence-backed profile, bullets, and expertise subset.
4. Write the appendix from the same evidence bank and a three-paragraph cover letter grounded in the posting.
5. Write `rationale.md` with the evidence trace, omissions, keyword gaps, and any seniority or requirement mismatch.
6. Build until the one-pager fits, then review bullet lint and keyword coverage.

When trimming overflow, shorten profile prose first, then remove the least relevant bullets starting with the oldest role, and trim expertise last. Never remove contact facts, dates, or employer names merely to make the page fit.

## Build and verification

```sh
node build.mjs <slug> [--workspace <path>]
npm test
npm run audit:public
```

Treat build failures as failures. Generated PDFs must be visually reviewed after template or layout changes. The tracked example is fictional and may be edited only with invented facts that do not derive from a real person's evidence.
