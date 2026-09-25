# Tasks

## 1. Design configuration

- [x] 1.1 Define built-in presets and optional workspace and variant design files, with current output as the no-config default; verify tests cover resolution order and unchanged legacy defaults.
- [x] 1.2 Validate layout, page geometry, fonts, colors, spacing, and section options before rendering; verify tests reject unknown keys and out-of-range values with the offending setting named.

## 2. Rendering

- [x] 2.1 Refactor one-page HTML assembly to share a single resolved content model across layouts; verify tests show identical candidate facts and plain-text output for both layouts.
- [x] 2.2 Add one-column and two-column templates or layout classes and apply validated design tokens; verify fictional PDFs visibly show the selected layout and styling.
- [x] 2.3 Parameterize page geometry and retain the final PDF page-count gate for both layouts; verify A4 and Letter builds, overflow failure, and no clipped content.

## 3. Cross-feature verification and guidance

- [x] 3.1 Extend the ATS PDF evidence fixture matrix to include one-column output; verify automated extraction checks pass for both layouts and report any reading-order warning.
- [x] 3.2 Extend the shared tailoring skill and Codex, Claude Code, and Cursor entry points to honor explicit design preferences and silently use defaults otherwise; verify fictional agent smoke checks select one column, preserve the default, and report an unfit requested layout without switching it.
- [x] 3.3 Add configuration examples and `/tailor`-first guidance without private candidate data; verify `npm test`, `npm run audit:public`, and fictional example builds pass, then visually review both layouts and page sizes.
