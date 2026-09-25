# Proposal

## Why

The one-page CV is fixed to one two-column A4 design, so changing its appearance requires editing shared templates and CSS. Users need reusable visual choices, including one- and two-column layouts, while preserving the one-page rule and stable candidate facts.

## What Changes

- Add a validated design configuration with named presets and per-variant overrides.
- Support one-column and two-column one-page layouts, plus configurable page, typography, color, spacing, and section styling options.
- Let the shared agentic tailoring skill apply a user's explicit preset or layout preference while creating a variant, so `/tailor` remains the normal entry point and no new command is required.
- Keep the current rendering as the default for existing workspaces and fail clearly on invalid design settings.
- Apply the existing one-page fit check to every design and verify the generated PDF visually and through the separate ATS PDF evidence capability.

## Capabilities

### New Capabilities

- `configurable-cv-design`: Select and customize a one-page CV design, including its column layout, without editing templates or candidate facts.

### Modified Capabilities

None.

## Impact

The one-page rendering path in `build.mjs`, HTML/CSS templates, optional workspace and variant design files, the shared tailoring skill and agent adapters, tests, and README will change. Appendix and cover-letter rendering stay outside this feature. Layout changes must preserve private-workspace isolation and truthful content.
