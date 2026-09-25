---
name: tailor
description: Tailor an evidence-backed CV for a job description in the active workspace, including an explicit one-page design preference and PDF extraction review. Use for a new job application variant; use rebuild for render-only changes.
---

# Tailor a CV

Use the active workspace selected by `--workspace`, `CV_WORKSPACE`, `cv.local.yaml`, or the fictional example, in that order. Real candidate facts stay in `.cv-local/` or an external workspace. Save the job description as `variants/<slug>/job-post.md`; create a kebab-case slug. Keep the posting separate from design preferences.

Read `data/profile.yaml` and relevant `data/evidence/*.md` before writing a claim. Employer names, held titles, dates, education, and contact facts must stay unchanged. Reword or select only supported claims; do not invent scope, seniority, technologies, metrics, or outcomes. An application headline can match a vacancy only when evidence supports its function and seniority. Record unsupported requirements, headline mismatches, and omissions in `rationale.md`.

Remove colleague names, ticket keys, internal URLs, repository names, codenames, confidential identifiers, and unnecessarily precise internal figures from application artifacts. Use roles and functions where possible. Scan changed files for these and for the workspace's private denylist before finishing.

Create `jd-keywords.yaml` from actual must-have and nice-to-have requirements. Tailor `onepager.yaml` with an honest headline, profile, relevant expertise subset, and evidence-backed role bullets. Write an appendix from the same evidence and a three-paragraph cover letter grounded in the posting. Explain evidence traces and gaps in `rationale.md`.

If the user explicitly requests `classic` or `compact`, or `one-column` or `two-column`, record the choice in `variants/<slug>/design.yaml`. Include only requested design overrides; use `preset` for presets and `layout` for layouts. Without a design preference, do not ask for one and do not create a variant design file: the workspace default or classic two-column default applies. If an explicit design setting is invalid, report the named setting. Keep the requested design if it does not fit.

Build with `node build.mjs <slug> --workspace <path>`. If the one-pager overflows, first shorten profile prose, then remove the least relevant bullets starting with the oldest role, then trim expertise. Preserve contact facts, dates, employers, and the requested layout. If evidence-safe trimming cannot fit, report the overflow and stop.

Read `variants/<slug>/out/ats-evidence.json` after a successful build. Report PDF extraction pass and any advisory section-order findings. If the build fails on missing PDF facts or extraction, report the failure and field paths; do not claim a pass. Also report the headline, keyword coverage, honest gaps, variant path, and output files. A passing PDF report checks extractable core facts in this PDF; it does not prove acceptance by every ATS. Run `npm run audit:public` with a local denylist when present.

For a request to render existing content, use `npm run rebuild -- <slug>` and keep tailored prose and facts untouched.
