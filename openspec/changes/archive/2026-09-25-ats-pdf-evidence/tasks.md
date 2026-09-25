# Tasks

## 1. PDF extraction and comparison

- [x] 1.1 Add a Node-compatible PDF text extractor as a pinned dependency; verify `npm ci` and a fictional PDF extraction smoke check succeed without a system PDF command.
- [x] 1.2 Implement core-fact comparison against resolved one-page content, including stable normalization and field-path diagnostics; verify focused tests cover matching, missing, wrapped, and Unicode text.
- [x] 1.3 Implement advisory section-order analysis and a report format that identifies the layout and extraction limits; verify tests show order warnings do not fail when core facts are present.

## 2. Build integration

- [x] 2.1 Run extraction on the final one-page PDF and write `out/ats-evidence.json`; verify the fictional base build produces a passing report.
- [x] 2.2 Fail the build for unreadable PDFs or missing core facts while retaining advisory order findings; verify negative tests exercise both failure paths and use field paths in diagnostics.

## 3. Evidence and documentation

- [x] 3.1 Add a real-PDF fictional fixture test for every layout supported at implementation time; verify `npm test` checks extracted facts from each rendered PDF.
- [x] 3.2 Move common tailoring rules into a repository skill and provide Codex, Claude Code, and Cursor discovery paths while retaining Claude `/tailor`; verify a fictional job can be tailored from each agent without diverging content or privacy rules.
- [x] 3.3 Have the shared skill report PDF pass, advisory order findings, or failure after its build, while render-only rebuild remains content-neutral; verify agent smoke checks and rebuild tests cover both paths.
- [x] 3.4 Document the simple `/tailor`-first flow and what the ATS report does and does not prove; verify `npm test` and `npm run audit:public` pass with no tracked generated PDFs or private identifiers.
