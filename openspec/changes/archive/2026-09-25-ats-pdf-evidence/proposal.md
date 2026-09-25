# Proposal

## Why

The project calls its plain-text output ATS-friendly, but it has no evidence that the generated PDF preserves candidate facts or a usable reading order when parsed. A visual one-page check cannot detect missing or scrambled PDF text.

## What Changes

- Check text extracted from each generated one-page CV PDF against the facts used to render it.
- Fail the build when a core fact is missing from the extracted PDF; report uncertain section-order findings for human review.
- Make the existing agentic `/tailor` workflow available through a shared repository skill for Codex, Claude Code, and Cursor. Tailoring remains the normal user entry point; PDF checks run during its build and the agent reports their result.
- Exercise every supported one-page layout with fictional fixtures and publish reproducible local test results. This is extraction evidence, not a guarantee of acceptance by every ATS.
- Keep job-description keyword coverage and the plain-text CV as separate existing outputs.

## Capabilities

### New Capabilities

- `ats-pdf-evidence`: Verify core facts in the generated one-page PDF and report extraction and reading-order findings for each supported layout.

### Modified Capabilities

None.

## Impact

The one-page build path in `build.mjs`, PDF extraction tooling, test fixtures and tests, shared agent instructions and adapters, and user documentation will change. Generated reports and private candidate data must stay inside the selected workspace's ignored output directory; the tracked tests use fictional data only. The configurable-design change adds a second layout that this capability must cover.
