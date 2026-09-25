# Design

## Context

See `proposal.md` for motivation and `specs/configurable-cv-design/spec.md` for behavior. `build.mjs` reads one fixed HTML file and CSS file for an A4 two-column one-page PDF. The renderer resolves candidate facts before assembling HTML, then tries a short set of scales and checks PDF page count. The shared tailoring skill planned by `ats-pdf-evidence` is the user-facing entry point; this change extends it with design selection. Appendix and cover-letter templates are separate.

## Goals / Non-Goals

**Goals:**
- Preserve the current output when no design settings are supplied.
- Let variants select a reusable look and override individual visual settings without duplicating profile facts.
- Render one- and two-column layouts from the same resolved content and fit either to one page.

**Non-Goals:**
- Accept arbitrary CSS or unrestricted filesystem font paths in user YAML.
- Restyle the appendix or cover letter in this change.
- Content rewriting inside the renderer; the tailoring agent may apply the existing evidence-safe cut order.

## Decisions

1. **Keep design separate from candidate facts.** Use optional `data/design.yaml` for workspace defaults and optional `variants/<slug>/design.yaml` for variant overrides. Resolve built-in preset defaults, then workspace settings, then variant settings by key. Avoid putting visual options in `profile.yaml` or `onepager.yaml`, where they would mix with facts and tailored prose. An absent design file resolves to the existing two-column A4 look.
2. **Use bounded, validated tokens.** Support layout (`one-column` or `two-column`), page size (`a4` or `letter`) and margins, bundled font choices and sizes, palette colors, spacing, column width for the two-column layout, header alignment, and section-rule styling. Validate types and ranges before launching Chromium; map values to CSS custom properties and layout classes rather than injecting raw CSS. Built-in presets provide coherent starting values. Alternative considered: exposing arbitrary CSS, which makes validation, reproducibility, and safe rendering harder.
3. **Build both layouts from one content model.** Resolve headline, profile, expertise, roles, education, certifications, and contacts once. Templates decide placement: the one-column layout uses a natural top-to-bottom sequence; the two-column layout retains a sidebar. Avoid separate content assembly code paths, which could cause factual drift. The generated plain-text CV remains based on resolved content, independent of design.
4. **Measure the chosen page geometry.** Parameterize page dimensions and margins rather than hard-coding A4 height in the overflow estimate. Continue checking the final PDF page count after fit attempts; never clip content. Invalid choices fail before generating a PDF. Visual regression review covers both layouts and page sizes.
5. **Make ATS verification a completion dependency.** The ATS PDF evidence change provides extraction checks for the current layout. Add the one-column output to its fictional layout matrix and resolve missing core facts before this design change is complete. Reading-order concerns remain advisory under that capability.
6. **Keep design selection inside tailoring.** The shared skill reads an explicit user preference for a supported preset or layout and records only the necessary variant override. Without a preference, it uses workspace defaults and does not interrupt the user for a design decision. If an explicit design remains unfit after the allowed tailoring cut order, report the failure without silently switching layouts. The same behavior must be available through the Codex, Claude Code, and Cursor adapters. Alternative considered: make users edit `design.yaml` before every `/tailor`, which adds a step to the main flow.

## Risks / Trade-offs

- [Many token combinations can overflow] → Bound values, retain the one-page gate, and test representative extremes rather than claiming every combination fits.
- [Two rendering paths can diverge in content] → Share the resolved content model and compare extracted core facts across both layouts.
- [Font changes can affect text extraction or fit] → Limit fonts to bundled choices initially, wait for fonts before PDF generation, and cover both layouts with PDF extraction tests.
- [Legacy variants might change appearance] → Keep the current design as the no-config default and add a baseline visual comparison.
- [Agent requests can mix job text and design instructions] → Keep the job posting as its own source file and record an explicit user design preference separately in variant design settings.

## Migration Plan

Introduce optional design files and a default preset matching current output, then extend the shared tailoring skill and agent adapters to record explicit design preferences. Existing workspaces continue to build without edits or additional user prompts. Rollback removes the optional design files and returns to the existing template path; source candidate facts remain unchanged.
