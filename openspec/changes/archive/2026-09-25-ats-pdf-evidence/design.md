# Design

## Context

See `proposal.md` for motivation and `specs/ats-pdf-evidence/spec.md` for behavior. `build.mjs` renders the one-page HTML through Puppeteer and currently checks only PDF page count. `cv-plain.txt` is built independently from the same profile and variant. The Claude-only `.claude/commands/tailor.md` already creates a variant and runs the build; render-only rebuild commands do not tailor. No PDF text extractor is installed, and `pdftotext` is not available in the current environment. Generated outputs already live in ignored variant `out/` directories.

## Goals / Non-Goals

**Goals:**
- Check the actual PDF emitted by Puppeteer, after final fit selection.
- Make core-fact checks stable across whitespace, typography, and line wrapping while preserving meaningful characters and numbers.
- Keep evidence reproducible with fictional fixtures on a standard Node installation.

**Non-Goals:**
- Claim compatibility with every commercial ATS or replace human visual review.
- Infer whether tailored prose is truthful; the evidence bank and tailoring workflow own that concern.
- Submit private CVs to a third-party parsing service.

## Decisions

1. **Run PDF extraction in the build path, then write a local report.** Use a maintained Node-compatible PDF text extractor as a runtime dependency so normal builds and CI do not require a separately installed system command. Generate `ats-evidence.json` under the variant's ignored `out/` directory before declaring build success. Failure to load or extract the PDF is a build failure. A separate check command can be added if it reuses the same verifier. Alternative considered: rely on `cv-plain.txt`; that would miss PDF rendering and encoding failures.
2. **Compare against resolved rendering data.** Reuse the merged profile and variant content already used for the PDF, not the base YAML alone. Match name, each nonempty contact value, employer, held title, role dates, and education degree, school, and dates. Normalize Unicode presentation variants and whitespace for comparison; do not discard digits or whole words. Record failures by field path in diagnostics without copying the full extracted PDF text into tracked files. Alternative considered: compare the entire PDF text byte for byte with `cv-plain.txt`; layout and typography make that brittle.
3. **Treat order as a separate advisory check.** Locate section headings and selected anchors in extracted reading order. Report missing or inverted anchors for human review when all core facts are present. The current two-column template places sidebar material before experience in the DOM, so imposing one canonical order as a hard gate would create layout-specific false failures. Alternative considered: use only visual page position, which does not show the order consumed by text extractors.
4. **Test every supported layout using actual PDFs.** Run a fictional fixture through the real renderer for each layout and assert core facts are extracted. Add focused verifier tests for a missing fact and an extraction error. When the configurable-design change adds one-column rendering, add it to this layout matrix before that feature is complete.
5. **Expose one agent-neutral tailoring workflow.** Put the common truthfulness, sanitization, variant-writing, build, and review procedure in a portable repository `SKILL.md`. Make it discoverable through Codex, Claude Code, and Cursor conventions, with thin host-specific entry points where needed, and document its path for other compatible agents. Keep Claude's `/tailor` command as a compatible entry point, and move shared rules to an agent-neutral guide while retaining Claude compatibility. The skill consumes the build's PDF result and reports it alongside keyword coverage and honest gaps; it does not implement PDF checks itself. Alternative considered: copy full tailoring instructions into each agent's command, which would let the rules drift.

## Risks / Trade-offs

- [A PDF extractor can report text in a different order than an ATS parser] → Label order findings advisory and document the extractor and its limits; do not market a passing result as universal ATS compatibility.
- [Unicode and line breaks can create false missing-fact results] → Normalize known presentation differences and cover accented and wrapped text with fictional fixtures, while keeping numeric facts intact.
- [Private data can leak through logs or fixtures] → Use field paths in routine diagnostics, store reports only under ignored workspace output, and keep all tracked fixtures fictional.
- [PDF extraction adds build time and a dependency] → Run it once on the final PDF and pin the dependency through `package-lock.json`.
- [Agent hosts discover skills differently] → Verify a fictional tailoring invocation in each supported host and keep thin adapters synchronized with the shared skill.

## Migration Plan

Add extraction and reporting to the existing one-page build, then turn core-fact failures into a gate after the fictional baseline passes. Move the existing Claude `/tailor` instructions into the shared skill and retain a compatibility entry point. Existing inputs need no migration. If a parser regression appears, revert the extraction integration without altering source workspaces or PDFs.
